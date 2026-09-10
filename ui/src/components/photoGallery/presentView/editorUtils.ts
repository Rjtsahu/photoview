export interface ImageAdjustments {
  brightness: number // -100 to 100
  contrast: number // -100 to 100
  saturation: number // -100 to 100
  warmth: number // -100 to 100
  exposure: number // -100 to 100
  sepia: number // 0 to 100
  grayscale: number // 0 to 100
  blur: number // 0 to 20 px
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  exposure: 0,
  sepia: 0,
  grayscale: 0,
  blur: 0,
}

export interface CropRect {
  x: number // 0 to 1 (normalized to image)
  y: number // 0 to 1
  width: number // 0 to 1
  height: number // 0 to 1
}

export const DEFAULT_CROP: CropRect = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
}

export type AspectRatioType = 'free' | 'original' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16'

export interface FilterPreset {
  id: string
  name: string
  adjustments: Partial<ImageAdjustments>
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    adjustments: { ...DEFAULT_ADJUSTMENTS },
  },
  {
    id: 'vivid',
    name: 'Vivid',
    adjustments: { brightness: 5, contrast: 25, saturation: 40, warmth: 5 },
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    adjustments: { warmth: 40, saturation: 20, brightness: 8, contrast: 15 },
  },
  {
    id: 'nordic',
    name: 'Cool Film',
    adjustments: { warmth: -40, contrast: 20, saturation: -15, brightness: 5 },
  },
  {
    id: 'bw_dramatic',
    name: 'B&W Drama',
    adjustments: { grayscale: 100, contrast: 45, brightness: -5 },
  },
  {
    id: 'noir',
    name: 'Film Noir',
    adjustments: { grayscale: 100, contrast: 60, brightness: -15, exposure: -10 },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    adjustments: { sepia: 35, warmth: 25, contrast: 15, saturation: -10, brightness: 5 },
  },
  {
    id: 'muted',
    name: 'Muted',
    adjustments: { saturation: -40, contrast: -10, brightness: 10 },
  },
]

/**
 * Builds the CSS / Canvas filter string based on adjustments.
 */
export const getFilterCssString = (adj: ImageAdjustments): string => {
  const brightnessVal = Math.max(0, 1 + adj.brightness / 100 + adj.exposure / 200)
  const contrastVal = Math.max(0, 1 + adj.contrast / 100)
  const saturateVal = Math.max(0, 1 + adj.saturation / 100)
  const grayscaleVal = Math.min(100, Math.max(0, adj.grayscale))
  const sepiaVal = Math.min(100, Math.max(0, adj.sepia + (adj.warmth > 0 ? adj.warmth * 0.35 : 0)))
  const blurVal = Math.max(0, adj.blur)

  // Warmth simulation via hue-rotate & sepia
  const hueRotateDeg = adj.warmth < 0 ? adj.warmth * 0.4 : 0

  const filters = [
    `brightness(${brightnessVal.toFixed(3)})`,
    `contrast(${contrastVal.toFixed(3)})`,
    `saturate(${saturateVal.toFixed(3)})`,
  ]

  if (grayscaleVal > 0) {
    filters.push(`grayscale(${grayscaleVal}%)`)
  }

  if (sepiaVal > 0) {
    filters.push(`sepia(${sepiaVal.toFixed(1)}%)`)
  }

  if (hueRotateDeg !== 0) {
    filters.push(`hue-rotate(${hueRotateDeg.toFixed(1)}deg)`)
  }

  if (blurVal > 0) {
    filters.push(`blur(${blurVal.toFixed(1)}px)`)
  }

  return filters.join(' ')
}

/**
 * Renders the edited image onto an HTML5 Canvas and triggers download.
 */
export const exportEditedImage = async (
  imgElement: HTMLImageElement,
  fileName: string,
  adjustments: ImageAdjustments,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  crop: CropRect
): Promise<void> => {
  const naturalWidth = imgElement.naturalWidth || imgElement.width
  const naturalHeight = imgElement.naturalHeight || imgElement.height

  if (!naturalWidth || !naturalHeight) {
    throw new Error('Image dimensions not available')
  }

  // 1. Calculate Crop Box in native image pixels
  const cropX = Math.round(crop.x * naturalWidth)
  const cropY = Math.round(crop.y * naturalHeight)
  const cropWidth = Math.max(1, Math.round(crop.width * naturalWidth))
  const cropHeight = Math.max(1, Math.round(crop.height * naturalHeight))

  // 2. Offscreen Canvas for cropping & filters
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas 2d context')

  // Calculate rotated dimensions of the cropped area
  const normalizedRotation = ((rotation % 360) + 360) % 360
  const is90or270 = normalizedRotation === 90 || normalizedRotation === 270

  canvas.width = is90or270 ? cropHeight : cropWidth
  canvas.height = is90or270 ? cropWidth : cropHeight

  ctx.save()

  // Apply CSS filter pipeline directly to 2D context
  ctx.filter = getFilterCssString(adjustments)

  // Move origin to center of destination canvas
  ctx.translate(canvas.width / 2, canvas.height / 2)

  // Apply Rotation
  if (normalizedRotation !== 0) {
    ctx.rotate((normalizedRotation * Math.PI) / 180)
  }

  // Apply Flip
  const scaleX = flipH ? -1 : 1
  const scaleY = flipV ? -1 : 1
  ctx.scale(scaleX, scaleY)

  // Draw the cropped portion centered
  // Source: (cropX, cropY, cropWidth, cropHeight)
  // Destination: (-cropWidth/2, -cropHeight/2, cropWidth, cropHeight)
  ctx.drawImage(
    imgElement,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    -cropWidth / 2,
    -cropHeight / 2,
    cropWidth,
    cropHeight
  )

  ctx.restore()

  // 3. Export as Blob and trigger browser download
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Failed to generate image blob'))
          return
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const dotIndex = fileName.lastIndexOf('.')
        const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName
        const ext = dotIndex !== -1 ? fileName.substring(dotIndex) : '.jpg'

        a.href = url
        a.download = `${baseName}_edited${ext.toLowerCase().endsWith('.png') ? '.png' : '.jpg'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        resolve()
      },
      'image/jpeg',
      0.95
    )
  })
}
