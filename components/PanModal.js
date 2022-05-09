import { Dialog, Transition } from '@headlessui/react'
import { CameraIcon } from '@heroicons/react/outline'
import { Fragment, useRef, useState } from 'react'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { storage } from '../utils/firebase'
import { updateuser } from '../utils/request'
import { useDispatch, useSelector } from 'react-redux'
import { useSession } from 'next-auth/react'
import { update } from '../redux/userSlice'
import { togglePan } from '../redux/panModalSlice'

function PanModal() {
  const isOpen = useSelector((state) => state.panModalState.isOpen)
  const dispatch = useDispatch()
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const { data: session } = useSession()

  const cancelButtonRef = useRef(null)
  const filePickerRef = useRef(null)

  const addImageToPost = (e) => {
    const reader = new FileReader()
    if (e.target.files[0]) {
      setUploadFile(e.target.files[0])
      reader.readAsDataURL(e.target.files[0])
    }

    reader.onload = (readerEvent) => {
      setSelectedFile(readerEvent.target.result)
    }
  }

  const uploadAadhar = async () => {
    if (loading) return
    if (!selectedFile) return

    setLoading(true)
    setProgress(0)

    const imageRef = ref(
      storage,
      `images/${session.user._id}/profileImg/${session.user.email}/pan`
    )
    const uploadTask = uploadBytesResumable(imageRef, uploadFile)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setProgress(prog)
      },
      (err) => setErrorMessage(err),
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
          const updatedUser = await updateuser({
            id: session.user._id,
            pan: url,
          })
          dispatch(update(updatedUser))
          setLoading(false)
          setSelectedFile(null)
          setProgress(0)
        })
      }
    )

    setLoading(false)
    setSelectedFile(null)
    setProgress(0)
    dispatch(togglePan())
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={() => dispatch(togglePan())}
      >
        <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <span
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block transform overflow-hidden rounded-lg bg-white p-8 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:align-middle">
              <div className="flex flex-col justify-center space-y-2">
                {selectedFile ? (
                  <img
                    className="w-full cursor-pointer rounded-md object-contain"
                    src={selectedFile}
                    onClick={() => setSelectedFile(null)}
                    alt=""
                  />
                ) : (
                  <div
                    onClick={() => filePickerRef.current.click()}
                    className="mx-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-red-100 transition-all hover:scale-125"
                  >
                    <div className="h-6 w-6">
                      <CameraIcon
                        className="h-full w-full text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )}

                <Dialog.Title
                  as="h3"
                  className="text-center text-lg font-medium leading-6 text-gray-900"
                >
                  Upload Pan Card
                </Dialog.Title>

                <div className="">
                  <input
                    type="file"
                    accept="image/*"
                    ref={filePickerRef}
                    onChange={addImageToPost}
                    hidden
                  />
                </div>

                {errorMessage && (
                  <p className="text-center text-xs uppercase text-red-600">
                    {errorMessage}
                  </p>
                )}

                <div className="mt-2">
                  <button
                    disabled={!selectedFile}
                    className="w-full cursor-pointer rounded-md bg-red-600 p-2 px-3 text-sm uppercase text-white transition-all hover:bg-white hover:text-red-600 hover:ring-2 hover:ring-red-600"
                    onClick={uploadAadhar}
                  >
                    Upload
                  </button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-3">
                <div className="relative h-full w-full bg-gray-300">
                  <div
                    style={{ width: `${progress}%` }}
                    className={`absolute inset-0 h-full bg-red-600`}
                  />
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
export default PanModal
