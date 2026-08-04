import { useEffect, useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import { createWorker } from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { medicineDatabase } from '../data/medicineDatabase'
import { checkDrugInteractions } from '../utils/checkDrugInteractions'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_IMAGE_DIMENSION = 2000

function getSeverityStyles(severity) {
  const normalizedSeverity = (severity || '').toLowerCase()

  switch (normalizedSeverity) {
    case 'high':
      return {
        border: 'border-red-500',
        background: 'bg-red-50',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700'
      }
    case 'moderate':
      return {
        border: 'border-orange-500',
        background: 'bg-orange-50',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700'
      }
    case 'low':
      return {
        border: 'border-green-500',
        background: 'bg-green-50',
        text: 'text-green-700',
        badge: 'bg-green-100 text-green-700'
      }
    default:
      return {
        border: 'border-gray-300',
        background: 'bg-gray-50',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-700'
      }
  }
}

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
    .replace(/[+*:\-()\[\]{}|<>]/g, ' ')
    .replace(/[^\w\s/.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeOcrText(text) {
  if (!text) {
    return ''
  }

  return text
    .split(/\r?\n/)
    .map((line) => normalizeOcrLine(line))
    .filter(Boolean)
    .join('\n')
}

function getPrescriptionSection(text) {
  const lines = normalizeOcrText(text)
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
    /\bdr\.?\b/.test(normalized) ||
    /\brefill\b/.test(normalized) ||
    /\bolabel\b/.test(normalized) ||
    /\bprn\b/.test(normalized) ||
    /\bmd\b/.test(normalized) ||
    /\bhospital\b/.test(normalized) ||
    /\bmedical centre\b/.test(normalized) ||
    /\bmedical center\b/.test(normalized) ||
    /\bclinic\b/.test(normalized) ||
    /\baddress\b/.test(normalized) ||
    /\bstreet\b/.test(normalized) ||
    /\broad\b/.test(normalized) ||
    /\bcity\b/.test(normalized) ||
    /\bphone\b/.test(normalized) ||
    /\bmobile\b/.test(normalized) ||
    /\bemail\b/.test(normalized) ||
    /\bwebsite\b/.test(normalized) ||
    /\bdea\b/.test(normalized) ||
    /\blic\b/.test(normalized) ||
    /\bpatient\b/.test(normalized) ||
    /\bname\b/.test(normalized) ||
    /\bage\b/.test(normalized) ||
    /\bdob\b/.test(normalized) ||
    /\bgender\b/.test(normalized) ||
    /\bsign\b/.test(normalized) ||
    /\brx number\b/.test(normalized) ||
    /\bprescription number\b/.test(normalized)
  )
}

function extractMedicineName(rawLine) {
  const line = normalizeOcrLine(rawLine)
  if (!line || line.length < 3) {
    return ''
  }

  const lowerLine = line.toLowerCase()
  if (
    /^(date|dated|doctor|dr|patient|name|address|phone|mobile|contact|clinic|hospital|license|age|refill|sig|signature|rx|℞|qty|quantity|days|morning|afternoon|evening|night|before|after|with|without|label|take)$/i.test(lowerLine) ||
    /^(name|address|date|age|phone|license|sig|signature)\b/i.test(line)
  ) {
    return ''
  }

  if (shouldStopLine(line)) {
    return ''
  }

  const stopTokens = ['bid', 'bd', 'od', 'tid', 'qid', 'sos', 'prn', 'hs', 'mg', 'mcg', 'ml', 'g', 'tab', 'tabs', 'tablet', 'tablets', 'cap', 'caps', 'capsule', 'capsules']
  const pieces = line.split(/\s+/)
  const cleanedPieces = []

  for (const piece of pieces) {
    const normalizedPiece = piece.toLowerCase().trim()
    if (!normalizedPiece) {
      continue
    }

    const hasNumber = /\d/.test(normalizedPiece)
    const isStopToken = stopTokens.includes(normalizedPiece)
    const isDosageInstruction = /^(?:[0-9]+(?:\.[0-9]+)?(?:\s*[a-z]+)?)$/i.test(normalizedPiece) && normalizedPiece.length <= 4

    if (hasNumber || isStopToken || isDosageInstruction) {
      break
    }

    cleanedPieces.push(piece)
  }

  const name = cleanedPieces.join(' ').trim()
  return name.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')
}

function isLikelyNonMedicineLine(line) {
  const normalized = line.trim()
  if (!normalized) {
    return true
  }

  if (/^\d+$/.test(normalized)) {
    return true
  }

  const letters = normalized.match(/[A-Za-z]/g) || []
  if (letters.length < 3) {
    return true
  }

  const uppercaseRatio = (normalized.match(/[A-Z]/g) || []).length / Math.max(1, normalized.length)
  if (uppercaseRatio > 0.5) {
    return true
  }

  if (/\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/.test(normalized)) {
    return true
  }

  if (/\b(?:\d{3,4}\s*[- ]\s*\d{3,4})\b/.test(normalized)) {
    return true
  }

  if (/\b(?:\d{3,5}\s+[A-Za-z]+(?:\s+[A-Za-z]+)*)\b/.test(normalized) && /\b(?:street|road|city|state|zip|postcode|address)\b/i.test(normalized)) {
    return true
  }

  if (/\b(?:phone|mobile|email|website|dea|lic|license|patient|name|address|street|road|city|dob|gender|signature|sign|refill|prescription number|rx number)\b/i.test(normalized)) {
    return true
  }

  return false
}

function parseMedicineLine(rawLine) {
  const line = normalizeOcrLine(rawLine)
  if (!line || line.length < 3) {
    return null
  }

  if (shouldStopLine(line) || isLikelyNonMedicineLine(line)) {
    return null
  }

  const frequencyMatch = line.match(/\b(BID|TID|QID|OD|BD|SOS|HS|AC|PC|PRN|STAT)\b/i)
  const frequency = frequencyMatch ? frequencyMatch[1].toUpperCase() : ''

  const strengthMatch = line.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|u|gr))/i)
  const strength = strengthMatch ? strengthMatch[1].trim() : ''

  const dosageMatch = line.match(/(\d+(?:\s*-\s*\d+)?(?:\s*\/\s*\d+)?)\s*(tab|tabs|tablet|tablets|cap|caps|capsule|capsules|ml|tsp|drop|drops|spray|unit|units)/i)
  const dosage = dosageMatch ? `${dosageMatch[1].trim()} ${dosageMatch[2].toLowerCase()}` : ''

  const name = extractMedicineName(line)
  if (!name || name.length < 2 || name.length > 80) {
    return null
  }

  const suspiciousSuffixPattern = /(?:^|\s)(?:s|p|d|m|dr|rx|℞|sig|signature|patient|name|address|phone|date|age|license|refill|label)(?:\s|$)/i
  if (suspiciousSuffixPattern.test(name)) {
    return null
  }

  return {
    name,
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

function normalizeTextForMatching(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .toLowerCase()
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg)\b/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\b(?:bid|tid|qid|od|bd|sos|hs|prn|ac|pc|stat)\b/g, ' ')
    .replace(/\b(?:tab|tabs|tablet|tablets|cap|caps|capsule|capsules|unit|units)\b/g, ' ')
    .replace(/[+*:\-()\[\]{}|<>]/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

function calculateSimilarity(a, b) {
  const normalizedA = normalizeTextForMatching(a)
  const normalizedB = normalizeTextForMatching(b)

  if (!normalizedA || !normalizedB) {
    return 0
  }

  const distance = levenshteinDistance(normalizedA, normalizedB)
  const maxLength = Math.max(normalizedA.length, normalizedB.length)
  return maxLength === 0 ? 1 : 1 - distance / maxLength
}

const medicineSearchIndex = new Fuse(medicineDatabase, {
  includeScore: true,
  threshold: 0.45,
  ignoreLocation: true,
  minMatchCharLength: 3,
  keys: ['name', 'genericName'],
})

function findBestMedicineMatch(ocrName) {
  const cleanedName = normalizeTextForMatching(ocrName)
  if (!cleanedName) {
    return null
  }

  const fuseResults = medicineSearchIndex.search(cleanedName)
  const bestFuseResult = fuseResults[0]

  if (bestFuseResult && typeof bestFuseResult.score === 'number' && bestFuseResult.score < 0.45) {
    return bestFuseResult.item
  }

  const candidates = medicineDatabase.flatMap((entry) => [entry.name, entry.genericName])
  let bestCandidate = null
  let bestSimilarity = 0

  candidates.forEach((candidate) => {
    const similarity = calculateSimilarity(cleanedName, candidate)
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestCandidate = candidate
    }
  })

  if (bestSimilarity >= 0.72) {
    return medicineDatabase.find((entry) => entry.name === bestCandidate || entry.genericName === bestCandidate) || null
  }

  return null
}

function enrichMedicinesWithDatabase(medicines) {
  return medicines
    .map((medicine) => {
      const match = findBestMedicineMatch(medicine.name)

      if (!match) {
        return null
      }

      return {
        ...medicine,
        matched: true,
        displayName: match.name,
        correctedName: match.name,
        ocrName: medicine.name,
        name: match.name,
        genericName: match.genericName,
        category: match.category,
        purpose: match.purpose,
        commonSideEffects: match.commonSideEffects,
        precautions: match.precautions,
      }
    })
    .filter(Boolean)
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
  const [drugInteractions, setDrugInteractions] = useState([])
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
    setDrugInteractions([])
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
    setDrugInteractions([])
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
    setDrugInteractions([])
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
      const normalizedText = normalizeOcrText(extractedText)
      const confidence = typeof result.data.confidence === 'number' ? result.data.confidence * 100 : 100
      const parsedMedicines = extractProbableMedicines(normalizedText)
      const enrichedMedicines = enrichMedicinesWithDatabase(parsedMedicines)
      const extractedMedicineNames = enrichedMedicines
        .map((medicine) => medicine.displayName || medicine.name || medicine.ocrName)
        .filter(Boolean)
      const interactions = checkDrugInteractions(extractedMedicineNames)

      setOcrText(normalizedText)
      setOcrConfidence(confidence)
      setMedicines(enrichedMedicines)
      setDrugInteractions(interactions)
    } catch (ocrError) {
      console.error('Prescription OCR failed:', ocrError)
      setError('We could not read the document clearly. Please try a sharper image, a different file, or a clearer scan.')
      setOcrText('')
      setMedicines([])
      setDrugInteractions([])
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
                      <div key={`${medicine.ocrName}-${medicine.displayName}-${medicine.strength}-${medicine.dosage}-${medicine.frequency}`} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">Medicine: {medicine.displayName}</p>
                            <p className="mt-1 text-xs text-cyan-100/80">Recognized from OCR: {medicine.ocrName}</p>
                          </div>
                          {medicine.frequency ? <span className="rounded-full bg-cyan-900/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">{medicine.frequency}</span> : null}
                        </div>
                        {medicine.matched ? (
                          <>
                            <div className="mt-3 space-y-2 text-cyan-50">
                              {medicine.category ? <p><span className="font-semibold text-white">Category:</span> {medicine.category}</p> : null}
                              {medicine.purpose ? <p><span className="font-semibold text-white">Purpose:</span> {medicine.purpose}</p> : null}
                              {medicine.commonSideEffects ? <p><span className="font-semibold text-white">Side Effects:</span> {medicine.commonSideEffects}</p> : null}
                              {medicine.precautions ? <p><span className="font-semibold text-white">Precautions:</span> {medicine.precautions}</p> : null}
                            </div>
                          </>
                        ) : (
                          <p className="mt-3 text-sm text-amber-100">{medicine.message}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {medicine.strength ? <span className="rounded-full bg-slate-900/30 px-2.5 py-1 text-xs font-semibold text-cyan-50">{medicine.strength}</span> : null}
                          {medicine.dosage ? <span className="rounded-full bg-slate-900/30 px-2.5 py-1 text-xs font-semibold text-cyan-50">{medicine.dosage}</span> : null}
                        </div>
                      </div>
                    ))}

                    {drugInteractions.length > 0 ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-800 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a1 1 0 00.9 1.48h18.56a1 1 0 00.9-1.48L13.71 3.86a1 1 0 00-1.72 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">⚠️ Drug Interaction Warnings</h4>
                            <p className="text-xs text-slate-500">Reviewed from the detected medicines.</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {drugInteractions.map((interaction, index) => {
                            const severityStyles = getSeverityStyles(interaction.severity)

                            return (
                              <div key={`${interaction.medicineA}-${interaction.medicineB}-${index}`} className={`rounded-2xl border border-slate-200 p-4 shadow-sm border-l-4 ${severityStyles.border} ${severityStyles.background} ${severityStyles.text}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className={`font-semibold ${severityStyles.text}`}>{interaction.medicineA} + {interaction.medicineB}</p>
                                    <p className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityStyles.badge}`}>{interaction.severity}</p>
                                  </div>
                                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${severityStyles.background} ${severityStyles.text}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a1 1 0 00.9 1.48h18.56a1 1 0 00.9-1.48L13.71 3.86a1 1 0 00-1.72 0z" />
                                    </svg>
                                  </div>
                                </div>

                                <div className="mt-3 space-y-3">
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Medicine A</p>
                                    <p className="mt-1 text-sm text-slate-700">{interaction.medicineA}</p>
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Medicine B</p>
                                    <p className="mt-1 text-sm text-slate-700">{interaction.medicineB}</p>
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Severity</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">{interaction.severity}</p>
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Risk</p>
                                    <p className="mt-1 text-sm text-slate-700">{interaction.risk}</p>
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Recommendation</p>
                                    <p className="mt-1 text-sm text-slate-700">{interaction.recommendation}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    {drugInteractions.length === 0 && (ocrText || medicines.length > 0) ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700 shadow-sm">
                        ✅ No known drug interactions found.
                      </div>
                    ) : null}
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
