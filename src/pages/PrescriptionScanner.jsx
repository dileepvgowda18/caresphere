import { useEffect, useMemo, useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_IMAGE_DIMENSION = 2000

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read the selected file.'))
    reader.readAsDataURL(file)
  })
}

function createProcessedCanvas(imageElement) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  const maxDimension = Math.max(imageElement.width, imageElement.height)
  const scale = maxDimension > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / maxDimension : 1

  canvas.width = Math.max(1, Math.floor(imageElement.width * scale))
  canvas.height = Math.max(1, Math.floor(imageElement.height * scale))

  context.filter = 'grayscale(1) contrast(1.2) brightness(1.05)'
  context.drawImage(imageElement, 0, 0, canvas.width, canvas.height)

  return canvas
}

async function prepareImageForOcr(file) {
  if (file.type === 'application/pdf') {
    const pdfData = await loadImageFromFile(file)
    const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData.split(',')[1]) })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport }).promise

    return canvas.toDataURL('image/png')
  }

  const imageDataUrl = await loadImageFromFile(file)
  const imageElement = document.createElement('img')
  imageElement.src = imageDataUrl

  await new Promise((resolve, reject) => {
    imageElement.onload = resolve
    imageElement.onerror = reject
  })

  const canvas = createProcessedCanvas(imageElement)
  return canvas.toDataURL('image/png')
}

function normalizeOcrLine(line) {
  return line
    .replace(/\u00a0/g, ' ')
    .replace(/[•◦▪·]+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[^\w\s/().:+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getPrescriptionSection(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeOcrLine(line))
    .filter(Boolean)

  const startIndex = lines.findIndex((line) => /^\s*(?:rx|℞)\b/i.test(line))
  if (startIndex === -1) {
    return lines
  }

  return lines.slice(startIndex + 1)
}

function shouldStopLine(line) {
  const normalized = line.toLowerCase()
  return (
    /\bsignature\b/.test(normalized) ||
    /\bdoctor\b/.test(normalized) ||
    /\brefill\b/.test(normalized) ||
    /\blabel\b/.test(normalized) ||
    /\bprn\b/.test(normalized)
  )
}

function parseMedicineLine(rawLine) {
  const line = normalizeOcrLine(rawLine)
  if (!line || line.length < 3) {
    return null
  }

  if (shouldStopLine(line)) {
    return null
  }

  const lowerLine = line.toLowerCase()
  if (
    /^(date|dated|doctor|dr|patient|name|address|phone|mobile|contact|clinic|hospital|license|age|refill|sig|signature|rx|℞|qty|quantity|days|morning|afternoon|evening|night|before|after|with|without|label|take)$/i.test(lowerLine) ||
    /^(name|address|date|age|phone|license|sig|signature)\b/i.test(line)
  ) {
    return null
  }

  const frequencyMatch = line.match(/\b(BID|TID|QID|OD|BD|HS|AC|PC|PRN|STAT)\b/i)
  const frequency = frequencyMatch ? frequencyMatch[1].toUpperCase() : ''

  const strengthMatch = line.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|u|gr))/i)
  const strength = strengthMatch ? strengthMatch[1].trim() : ''

  const dosageMatch = line.match(/(\d+(?:\s*-\s*\d+)?(?:\s*\/\s*\d+)?)\s*(tab|tabs|tablet|tablets|cap|caps|capsule|capsules|ml|tsp|drop|drops|spray|unit|units)/i)
  const dosage = dosageMatch ? `${dosageMatch[1].trim()} ${dosageMatch[2].toLowerCase()}` : ''

  const hasMedicineSignal = /[A-Za-z]/.test(line) && (strength || dosage || frequency)
  if (!hasMedicineSignal) {
    return null
  }

  let name = line
  if (strength) {
    name = name.replace(strength, ' ')
  }
  if (dosage) {
    name = name.replace(dosage, ' ')
  }
  if (frequency) {
    name = name.replace(new RegExp(`\\b${frequency}\\b`, 'i'), ' ')
  }

  name = name
    .replace(/[-–—:;,.]+/g, ' ')
    .replace(/\b(?:take|takes|daily|twice|three|four|once|as|needed|for|with|without|per|every|at|s)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!name || name.length < 2 || name.length > 80) {
    return null
  }

  const suspiciousSuffixPattern = /(?:^|\s)(?:s|p|d|m|dr|rx|℞|sig|signature|patient|name|address|phone|date|age|license|refill|label)(?:\s|$)/i
  if (suspiciousSuffixPattern.test(name)) {
    return null
  }

  return {
    name: name.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''),
    strength,
    dosage,
    frequency,
  }
}

function extractProbableMedicines(text) {
  if (!text) {
    return []
  }

  const lines = getPrescriptionSection(text)
  const medicines = []
  const seen = new Set()

  lines.forEach((line) => {
    const parsedMedicine = parseMedicineLine(line)
    if (!parsedMedicine) {
      return
    }

    const key = `${parsedMedicine.name.toLowerCase()}|${parsedMedicine.strength.toLowerCase()}|${parsedMedicine.dosage.toLowerCase()}|${parsedMedicine.frequency.toLowerCase()}`
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    medicines.push(parsedMedicine)
  })

  return medicines
}

function PrescriptionScanner() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrConfidence, setOcrConfidence] = useState(100)
  const [ocrText, setOcrText] = useState('')
  const [medicines, setMedicines] = useState([])
  const fileInputRef = useRef(null)

  const previewUrl = useMemo(() => {
    if (!selectedImage) {
      return ''
    }

    return URL.createObjectURL(selectedImage)
  }, [selectedImage])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileSelection(file) {
    if (!file) {
      return
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Please upload a JPG, JPEG, PNG image, or a PDF file.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('The selected file exceeds the 10 MB limit.')
      return
    }

    setError('')
    setOcrText('')
    setMedicines([])
    setOcrConfidence(100)
    setSelectedImage(file)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)

    const file = event.dataTransfer.files?.[0]
    handleFileSelection(file)
  }

  function handleFileInput(event) {
    const file = event.target.files?.[0]
    handleFileSelection(file)
  }

  function handleRemoveImage() {
    setSelectedImage(null)
    setError('')
    setOcrText('')
    setMedicines([])
    setOcrConfidence(100)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleExtract() {
    if (!selectedImage) {
      return
    }

    setIsLoading(true)
    setError('')
    setOcrText('')
    setMedicines([])
    setOcrConfidence(100)
    setOcrProgress(0)

    let worker = null

    try {
      worker = await createWorker('eng', 1, {
        logger: ({ progress }) => {
          if (typeof progress === 'number') {
            setOcrProgress(Math.round(progress * 100))
          }
        },
      })
      await worker.setParameters({
        tessedit_pageseg_mode: '3',
        preserve_interword_spaces: '1',
      })

      const processedImage = await prepareImageForOcr(selectedImage)
      const result = await worker.recognize(processedImage)
      const extractedText = result.data.text || 'No text detected in the uploaded image.'
      const confidence = typeof result.data.confidence === 'number' ? result.data.confidence * 100 : 100
      setOcrText(extractedText)
      setOcrConfidence(confidence)
      setMedicines(extractProbableMedicines(extractedText))
    } catch (ocrError) {
      console.error('Prescription OCR failed:', ocrError)
      setError('We could not read the document clearly. Please try a sharper image, a different file, or a clearer scan.')
      setOcrText('')
      setMedicines([])
    } finally {
      if (worker) {
        await worker.terminate()
      }
      setIsLoading(false)
      setOcrProgress(0)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <section className="mb-8 text-center">
        <p className="mb-3 inline-block rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-700">
          MediSphere AI
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">Prescription Scanner</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Upload a prescription to extract medicine names and understand your medications.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragActive ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-slate-50'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">Drag & Drop your prescription</h3>
            <p className="mt-2 text-sm text-slate-600">Upload JPG, JPEG, PNG, or PDF files up to 10 MB.</p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <label className="cursor-pointer rounded-full bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800">
                Browse File
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileInput} />
              </label>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Change Image
              </button>
            </div>
            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          </div>

          {selectedImage && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">Image Preview</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-cyan-700 hover:text-cyan-800">
                    Change Image
                  </button>
                  <button type="button" onClick={handleRemoveImage} className="text-sm font-medium text-rose-600 hover:text-rose-700">
                    Remove Image
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={previewUrl} alt="Prescription preview" className="h-64 w-full object-contain" />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExtract}
              className="rounded-full bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400"
              disabled={!selectedImage || isLoading}
            >
              {isLoading ? 'Scanning...' : 'Extract Medicines'}
            </button>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                Scanning image... {Math.round(ocrProgress)}%
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-700 via-sky-700 to-blue-800 p-6 text-white shadow-sm">
          <h3 className="text-xl font-semibold">Results</h3>
          <p className="mt-2 text-sm text-cyan-50">Your extracted medicine names will appear here once scanning begins.</p>

          <div className="mt-6 rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">Medicine Names</p>
              <div className="mt-4 space-y-3">
                {error ? (
                  <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : medicines.length > 0 ? (
                  <div className="space-y-3">
                    {ocrConfidence < 70 ? (
                      <div className="rounded-xl border border-amber-300 bg-amber-100/80 px-4 py-3 text-sm text-amber-900">
                        Low confidence OCR. Please verify medicine names.
                      </div>
                    ) : null}
                    {medicines.map((medicine) => (
                      <div key={`${medicine.name}-${medicine.strength}-${medicine.dosage}-${medicine.frequency}`} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-white">{medicine.name}</p>
                          {medicine.frequency ? <span className="rounded-full bg-cyan-900/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">{medicine.frequency}</span> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {medicine.strength ? <span className="rounded-full bg-slate-900/30 px-2.5 py-1 text-xs font-semibold text-cyan-50">{medicine.strength}</span> : null}
                          {medicine.dosage ? <span className="rounded-full bg-slate-900/30 px-2.5 py-1 text-xs font-semibold text-cyan-50">{medicine.dosage}</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
                    No prescription medicines were detected from the extracted text.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PrescriptionScanner
