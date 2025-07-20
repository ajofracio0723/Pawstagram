import React, { useState, useEffect } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { v4 as uuidv4 } from "uuid"
import PaginationButton from "./Pagination"
import Swal from "sweetalert2"

function Gallery() {
	const [imageUpload, setImageUpload] = useState(null)
	const [imageList, setImageList] = useState([])
	const [currentPage, setCurrentPage] = useState(1)
	const [loading, setLoading] = useState(false)
	const [uploadedImagesCount, setUploadedImagesCount] = useState(0)
	const imagesPerPage = 6
	const maxUploadSizeInBytes = 2 * 1024 * 1024 // 2MB

	// Session storage for upload count
	const getUploadedImagesCount = () => {
		const uploadedImages = sessionStorage.getItem("uploadedImages")
		return uploadedImages ? parseInt(uploadedImages) : 0
	}

	const incrementUploadedImagesCount = () => {
		const uploadedImages = getUploadedImagesCount()
		sessionStorage.setItem("uploadedImages", uploadedImages + 1)
		setUploadedImagesCount(uploadedImages + 1)
	}

	const uploadImage = async () => {
		if (imageUpload == null) return
		
		const currentCount = getUploadedImagesCount()

		if (currentCount >= 5) {
			Swal.fire({
				icon: "error",
				title: "Oops...",
				text: "Im sorry, you can only upload 5 photos.",
			})
			return
		}

		if (imageUpload.size > maxUploadSizeInBytes) {
			Swal.fire({
				icon: "error",
				title: "Oops...",
				text: "The maximum size for a photo is 2MB",
			})
			setSelectedImage(null)
			return
		}

		setLoading(true)

		try {
			// Create unique filename
			const fileExt = imageUpload.name.split('.').pop()
			const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`

			// Upload file to Supabase Storage
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('images')
				.upload(fileName, imageUpload)

			if (uploadError) {
				throw uploadError
			}

			// Get public URL
			const { data: { publicUrl } } = supabase.storage
				.from('images')
				.getPublicUrl(fileName)

			// Optional: Save metadata to database table
			try {
				const { error: dbError } = await supabase
					.from('images')
					.insert([
						{
							filename: fileName,
							original_name: imageUpload.name,
							file_size: imageUpload.size,
							mime_type: imageUpload.type,
							storage_path: uploadData.path,
							public_url: publicUrl
						}
					])
				
				// Don't fail if database insert fails (table might not exist)
				if (dbError) {
					console.log('Database insert failed (table might not exist):', dbError)
				}
			} catch (dbError) {
				console.log('Database operation failed:', dbError)
			}

			// Add to image list
			setImageList((prev) => [...prev, publicUrl])
			incrementUploadedImagesCount()
			setSelectedImage(null)

			Swal.fire({
				position: "top-end",
				icon: "success",
				title: "Image Uploaded Successfully",
				showConfirmButton: false,
				timer: 1500,
				customClass: {
					popup: "my-custom-popup",
					title: "my-custom-title",
					icon: "my-custom-icon",
				},
			})

		} catch (error) {
			console.error('Upload error:', error)
			Swal.fire({
				icon: "error",
				title: "Upload Failed",
				text: error.message || "Something went wrong during upload",
			})
		} finally {
			setLoading(false)
		}
	}

	// Fetch images from Supabase on component mount
	useEffect(() => {
		fetchImages()
		setUploadedImagesCount(getUploadedImagesCount())
	}, [])

	const fetchImages = async () => {
		try {
			// Try to fetch from database first (if table exists)
			const { data: dbImages, error: dbError } = await supabase
				.from('images')
				.select('public_url, uploaded_at')
				.eq('is_active', true)
				.order('uploaded_at', { ascending: false })

			if (!dbError && dbImages && dbImages.length > 0) {
				// Use database images
				const imageUrls = dbImages.map(img => img.public_url)
				setImageList(imageUrls)
				return
			}
		} catch (error) {
			console.log('Database fetch failed, falling back to storage list:', error)
		}

		// Fallback: Fetch directly from storage
		try {
			const { data, error } = await supabase.storage
				.from('images')
				.list('', {
					limit: 100,
					offset: 0,
					sortBy: { column: 'created_at', order: 'desc' }
				})

			if (error) {
				throw error
			}

			// Filter out folders and get only image files
			const imageFiles = data.filter(file => 
				file.name && 
				!file.name.includes('/') && 
				(file.name.toLowerCase().endsWith('.jpg') || 
				 file.name.toLowerCase().endsWith('.jpeg') || 
				 file.name.toLowerCase().endsWith('.png') || 
				 file.name.toLowerCase().endsWith('.gif') ||
				 file.name.toLowerCase().endsWith('.webp'))
			)

			// Get public URLs for all images
			const imageUrls = imageFiles.map(file => {
				const { data: { publicUrl } } = supabase.storage
					.from('images')
					.getPublicUrl(file.name)
				return publicUrl
			})

			setImageList(imageUrls)

		} catch (error) {
			console.error('Error fetching images:', error)
		}
	}

	const getPaginatedImages = () => {
		const indexOfLastImage = currentPage * imagesPerPage
		const indexOfFirstImage = indexOfLastImage - imagesPerPage
		return imageList.slice(indexOfFirstImage, indexOfLastImage)
	}

	const paginatedImages = getPaginatedImages()

	const handlePageChange = (event, newPage) => {
		setCurrentPage(newPage)
	}

	const [selectedImage, setSelectedImage] = useState(null)

	const handleImageChange = (event) => {
		setImageUpload(event.target.files[0])
		const file = event.target.files[0]
		if (file) {
			setSelectedImage(URL.createObjectURL(file))
		}
	}

	return (
		<div>
			<div className="md:flex md:px-[20%] px-0 flex-col md:flex-row relative md:bottom-0 bottom-5">
				<div className="md:w-1/2 w-[100%] md:px-0 px-[19%] text-white flex justify-center items-center">
					<div className="md:text-left text-center relative md:left-[4.5%] md:bottom-10">
						<h1 className="text-3xl md:text-5xl font-bold mb-4 w-full">
							Upload Your Dog's Best Shots!
						</h1>
						<p className="text-sm opacity-75">
							{uploadedImagesCount}/5 images uploaded
						</p>
					</div>
				</div>

				<div className="md:w-1/2 w-full flex justify-center items-center flex-col">
					<div className="mx-auto p-4">
						<form>
							<div className="flex mb-4">
								<input
									type="file"
									id="imageUpload"
									className="hidden"
									accept="image/*"
									onChange={handleImageChange}
								/>
								<label
									htmlFor="imageUpload"
									className="cursor-pointer border-dashed border-2 border-gray-400 rounded-lg p-4 w-full h-auto flex items-center justify-center">
									{selectedImage ? (
										<div className="w-full h-full overflow-hidden">
											<img
												src={selectedImage}
												alt="Preview Gambar"
												className="w-full h-full object-cover"
											/>
										</div>
									) : (
										<div className="text-center px-5 py-8">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												className="h-12 w-12 mx-auto text-gray-400">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 6v6m0 0v6m0-6h6m-6 0H6"
												/>
											</svg>
											<p className="text-gray-600">click to select an image</p>
										</div>
									)}
								</label>
							</div>
						</form>
					</div>

					<button
						type="button"
						disabled={loading || !imageUpload}
						className="py-2.5 w-[60%] mb-0 md:mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={uploadImage}>
						{loading ? "UPLOADING..." : "UPLOAD"}
					</button>
				</div>
			</div>

			<br />
			<b
				className="text-[48px] mt-0 text-white pt-5 opacity-[90%] flex items-center justify-center border-t-[8px] border-[#232323] shadow-lg"
				id="Gallery">
				Gallery
			</b>

			{imageList.length === 0 ? (
				<div className="text-center text-white py-10">
					<p className="text-lg">No images uploaded yet. Upload your first dog photo!</p>
				</div>
			) : (
				<div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-10" id="ContainerGallery">
					<div className="-m-1 flex flex-wrap md:-m-2">
						<div className="flex w-1/2 flex-wrap">
							<div className="w-1/2 p-1 md:p-2" id="ContainerImgGallery">
								{paginatedImages[0] && (
									<img
										alt="gallery"
										className="block h-full w-full rounded-lg object-cover object-center"
										src={paginatedImages[0]}
									/>
								)}
							</div>
							<div className="w-1/2 p-1 md:p-2" id="ContainerImgGallery">
								{paginatedImages[1] && (
									<img
										alt="gallery"
										className="block h-full w-full rounded-lg object-cover object-center"
										src={paginatedImages[1]}
									/>
								)}
							</div>
							<div className="w-full p-1 md:p-2" id="ContainerImgGallery">
								{paginatedImages[2] && (
									<img
										alt="gallery"
										className="block h-full w-full rounded-lg object-cover object-center"
										src={paginatedImages[2]}
									/>
								)}
							</div>
						</div>
						<div className="flex w-1/2 flex-wrap">
							<div className="w-full p-1 md:p-2" id="ContainerImgGallery">
								{paginatedImages[3] && (
									<img
										alt="gallery"
										className="block h-full w-full rounded-lg object-cover object-center"
										src={paginatedImages[3]}
									/>
								)}
							</div>
							<div className="w-1/2 p-1 md:p-2" id="ContainerImgGallery">
								{paginatedImages[4] && (
									<img
										alt="gallery"
										className="block h-full w-full rounded-lg object-cover object-center"
										src={paginatedImages[4]}
									/>
								)}
							</div>
							<div className="w-1/2 p-1 md:p-2" id="ContainerImgGallery">
								{paginatedImages[5] && (
									<img
										alt="gallery"
										className="block h-full w-full rounded-lg object-cover object-center"
										src={paginatedImages[5]}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{imageList.length > 0 && (
				<div className="ButtonPagination">
					<div className="pagination-container">
						<div className="pagination-wrapper">
							<PaginationButton
								currentPage={currentPage}
								totalPages={Math.ceil(imageList.length / imagesPerPage)}
								onPageChange={handlePageChange}
							/>
						</div>
					</div>
				</div>
			)}
			<br />
			<br />
			<br />
		</div>
	)
}

const PaginationLink = () => {
	return (
		<MemoryRouter initialEntries={["/inbox"]} initialIndex={0}>
			<Routes>
				<Route path="*" element={<Gallery />} />
			</Routes>
		</MemoryRouter>
	)
}

export default PaginationLink