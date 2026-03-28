import { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import './ImageCropper.css'

interface ImageCropperProps {
    imageSrc: string
    onCropComplete: (croppedImage: string) => void
    onCancel: () => void
    aspect?: number
}

const ImageCropper = ({
    imageSrc,
    onCropComplete,
    onCancel,
    aspect = 1
}: ImageCropperProps) => {
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const imgRef = useRef<HTMLImageElement>(null)

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget
        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                aspect,
                width,
                height
            ),
            width,
            height
        )
        setCrop(crop)
    }

    const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): string => {
        const canvas = document.createElement('canvas')
        const scaleX = image.naturalWidth / image.width
        const scaleY = image.naturalHeight / image.height
        
        // Use natural dimensions for perfect quality
        canvas.width = crop.width * scaleX
        canvas.height = crop.height * scaleY
        
        const ctx = canvas.getContext('2d')

        if (!ctx) return ''

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY
        )

        return canvas.toDataURL('image/webp', 0.9)
    }

    const handleSave = () => {
        if (imgRef.current && completedCrop) {
            const croppedDataUrl = getCroppedImg(imgRef.current, completedCrop)
            onCropComplete(croppedDataUrl)
        }
    }

    return (
        <div className="cropper-overlay">
            <div className="cropper-modal">
                <div className="cropper-header">
                    <h3>Adjust Profile Picture</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>

                <div className="cropper-body">
                    <ReactCrop
                        crop={crop}
                        onChange={(_: PixelCrop, percentCrop: Crop) => setCrop(percentCrop)}
                        onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                        aspect={aspect}
                        circularCrop
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imageSrc}
                            onLoad={onImageLoad}
                            style={{ maxHeight: '60vh', width: 'auto' }}
                        />
                    </ReactCrop>
                </div>

                <div className="cropper-footer">
                    <button className="cancel-btn" onClick={onCancel}>Cancel</button>
                    <button className="save-btn" onClick={handleSave}>Save & Apply</button>
                </div>
            </div >
        </div >
    )
}

export default ImageCropper
