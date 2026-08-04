import { useEffect, useMemo, useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { analyzeMedicalReport } from '../utils/analyzeMedicalReport'

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

function normalizeOcrText(text) {
  if (!text) {
    return ''
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

// Detect whether OCR output looks like a laboratory report, a prescription, or an unknown document.
function detectDocumentType(text) {
  const normalizedText = normalizeOcrText(text).toLowerCase()

  if (!normalizedText) {
    return 'Unknown'
  }

  const prescriptionKeywords = /(rx|prescription|bid|tid|qid|tablet|tablets|capsule|capsules|mg|dr\.?|signature)/i
  const laboratoryKeywords = /(hemoglobin|glucose|creatinine|platelets|wbc|rbc|cholesterol|hba1c|tsh|potassium|sodium|alt|ast|bilirubin|albumin|crp|esr|ferritin|iron|uric acid)/i

  if (prescriptionKeywords.test(normalizedText) && !laboratoryKeywords.test(normalizedText)) {
    return 'Prescription'
  }

  if (laboratoryKeywords.test(normalizedText)) {
    return 'Lab Report'
  }

  return 'Unknown'
}

function getStatusStyle(status) {
  const normalizedStatus = (status || '').toLowerCase()

  switch (normalizedStatus) {
    case 'high':
      return {
        border: 'border-red-300',
        bg: 'bg-red-50',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
        icon: '🔴'
      }
    case 'low':
      return {
        border: 'border-sky-300',
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        badge: 'bg-sky-100 text-sky-700',
        icon: '🔵'
      }
    case 'borderline':
      return {
        border: 'border-amber-300',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-700',
        icon: '🟡'
      }
    default:
      return {
        border: 'border-emerald-300',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-700',
        icon: '🟢'
      }
  }
}

function getDisplayStatus(result) {
  const numericValue = Number(result?.value)
  const normalRange = result?.normalRange || ''
  const lowerBoundMatch = normalRange.match(/(\d+(?:\.\d+)?)/g)

  if (!Number.isFinite(numericValue) || !lowerBoundMatch || lowerBoundMatch.length < 2) {
    return result?.status || 'Normal'
  }

  const lowerBound = Number(lowerBoundMatch[0])
  const upperBound = Number(lowerBoundMatch[1])
  const tolerance = (upperBound - lowerBound) * 0.1

  if (result?.status === 'Normal' && numericValue >= lowerBound && numericValue <= upperBound) {
    if (numericValue <= lowerBound + tolerance || numericValue >= upperBound - tolerance) {
      return 'Borderline'
    }
  }

  return result?.status || 'Normal'
}

function MedicalReportAnalyzer() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [analysisResults, setAnalysisResults] = useState([])
  const [documentType, setDocumentType] = useState('Unknown')
  const [showExtractedText, setShowExtractedText] = useState(false)
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

  const summary = useMemo(() => {
    const normalCount = analysisResults.filter((result) => getDisplayStatus(result) === 'Normal').length
    const highCount = analysisResults.filter((result) => getDisplayStatus(result) === 'High').length
    const lowCount = analysisResults.filter((result) => getDisplayStatus(result) === 'Low').length
    const abnormalCount = highCount + lowCount

    return {
      normalCount,
      highCount,
      lowCount,
      abnormalCount,
      overallRecommendation: abnormalCount > 0
        ? 'Consult your physician for abnormal findings.'
        : 'No abnormal findings detected. Continue routine monitoring.'
    }
  }, [analysisResults])

  function handleFileSelection(file) {
    if (!file) {
      return
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Please upload a JPG, JPEG, PNG image, or a PDF medical report.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('The selected file exceeds the 10 MB limit.')
      return
    }

    setError('')
    setExtractedText('')
    setAnalysisResults([])
    setDocumentType('Unknown')
    setSelectedImage(file)
    setShowExtractedText(false)
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
    setExtractedText('')
    setAnalysisResults([])
    setDocumentType('Unknown')
    setShowExtractedText(false)
    setOcrProgress(0)
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
    setExtractedText('')
    setAnalysisResults([])
    setDocumentType('Unknown')
    setOcrProgress(0)
    setShowExtractedText(false)

    let worker = null

    try {
      worker = await createWorker('eng', 1, {
        logger: ({ progress }) => {
          if (typeof progress === 'number') {
            setOcrProgress(Math.round(progress * 100))
          }
        }
      })

      await worker.setParameters({
        tessedit_pageseg_mode: '3',
        preserve_interword_spaces: '1'
      })

      const processedImage = await prepareImageForOcr(selectedImage)
      const result = await worker.recognize(processedImage)
      const normalizedText = normalizeOcrText(result.data.text || 'No text detected in the uploaded report.')
      const detectedType = detectDocumentType(normalizedText)

      setDocumentType(detectedType)
      setExtractedText(normalizedText)
      setShowExtractedText(Boolean(normalizedText))

      if (detectedType === 'Lab Report') {
        const parsedResults = analyzeMedicalReport(normalizedText)
        setAnalysisResults(parsedResults)
      } else {
        setAnalysisResults([])
      }
    } catch (ocrError) {
      console.error('Medical report OCR failed:', ocrError)
      setError('We could not read the document clearly. Please try a sharper image or a different file.')
      setExtractedText('')
      setAnalysisResults([])
      setDocumentType('Unknown')
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
          🧬 Medical Report Analyzer
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">Upload a medical report and review the lab findings</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Extract and interpret common laboratory values from scanned PDF or image reports with OCR-powered analysis.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div
            className={`rounded-2xl border-2 border-dashed p-6 transition ${dragActive ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-slate-50'}`}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-cyan-100 p-3 text-2xl">📄</div>
              <h3 className="text-lg font-semibold text-slate-900">Drag and drop your report</h3>
              <p className="mt-2 text-sm text-slate-600">Upload a PDF, JPG, JPEG, or PNG report to start OCR analysis.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileInput}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Choose File
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {selectedImage ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Preview</p>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Remove
                  </button>
                </div>
                {selectedImage.type === 'application/pdf' ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    📄 {selectedImage.name}
                  </div>
                ) : (
                  <img src={previewUrl} alt="Medical report preview" className="max-h-72 w-full rounded-xl object-contain" />
                )}
              </div>

              <button
                type="button"
                onClick={handleExtract}
                disabled={isLoading}
                className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? 'Analyzing report...' : 'Analyze Report'}
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-cyan-700">
                <span>OCR in progress</span>
                <span>{ocrProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cyan-100">
                <div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${ocrProgress}%` }} />
              </div>
              <p className="mt-3 text-sm text-cyan-700">Scanning the report and detecting laboratory values…</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          {documentType === 'Lab Report' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h3 className="text-xl font-semibold text-slate-900">Medical Report Summary</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">Normal Tests</p>
                  <p className="text-2xl font-semibold text-emerald-800">{summary.normalCount}</p>
                </div>
                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-sm text-red-700">High Values</p>
                  <p className="text-2xl font-semibold text-red-800">{summary.highCount}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="text-sm text-sky-700">Low Values</p>
                  <p className="text-2xl font-semibold text-sky-800">{summary.lowCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-700">Abnormal Results</p>
                  <p className="text-2xl font-semibold text-slate-900">{summary.abnormalCount}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold">Overall Recommendation</p>
                <p className="mt-1">{summary.overallRecommendation}</p>
              </div>
            </div>
          ) : null}

          {extractedText ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                onClick={() => setShowExtractedText((currentValue) => !currentValue)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-cyan-700">📝 OCR Extracted Text</p>
                  <p className="text-sm text-slate-600">View the raw extracted content from the report</p>
                </div>
                <span className="text-xl text-slate-500">{showExtractedText ? '▾' : '▸'}</span>
              </button>

              {showExtractedText ? (
                <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {extractedText}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        {documentType === 'Prescription' ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">📄</span>
              <h3 className="text-xl font-semibold text-amber-800">Document Type</h3>
            </div>
            <p className="mt-3 text-lg font-semibold text-amber-900">Prescription</p>
            <p className="mt-2 text-sm text-amber-800">This document appears to be a prescription rather than a laboratory report.</p>
            <p className="mt-2 text-sm text-amber-800">Please use the Prescription Scanner to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
              <li>Extract medicines</li>
              <li>View medicine information</li>
              <li>Check drug interactions</li>
            </ul>
          </div>
        ) : null}

        {documentType === 'Unknown' ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Unable to determine the document type.</p>
            <p className="mt-2 text-sm text-slate-600">Please upload a clearer laboratory report or prescription image.</p>
          </div>
        ) : null}

        {documentType === 'Lab Report' && analysisResults.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {analysisResults.map((result) => {
              const displayStatus = getDisplayStatus(result)
              const styles = getStatusStyle(displayStatus)

              return (
                <div key={`${result.testName}-${result.value}`} className={`rounded-3xl border ${styles.border} ${styles.bg} p-5 shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">🧪 {result.testName}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{result.value} {result.unit}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles.badge}`}>
                      {styles.icon} {displayStatus}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p><span className="font-semibold">Normal Range:</span> {result.normalRange}</p>
                    <p><span className="font-semibold">Status:</span> {displayStatus}</p>
                    <p><span className="font-semibold">Explanation:</span> {result.simpleExplanation}</p>
                    <p><span className="font-semibold">Recommendation:</span> {result.recommendation}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {documentType === 'Lab Report' && analysisResults.length === 0 && extractedText ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">No laboratory values detected in this document.</p>
            <p className="mt-2 text-sm text-slate-600">Upload a report with recognizable lab values and try again.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default MedicalReportAnalyzer
