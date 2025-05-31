import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { MAX_UPLOAD_FILES, MAX_UPLOAD_VIDEOS, MAX_UPLOAD_DOCUMENTS, SUPPORTED_FILE_TYPES } from '../constants';

interface FileUploadProps {
  onFilesAccepted: (files: File[]) => void;
  onError: (message: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesAccepted, onError }) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const processedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          if (SUPPORTED_FILE_TYPES.images.includes(file.type)) {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true
            };
            return await imageCompression(file, options);
          }
          return file;
        })
      );

      onFilesAccepted(processedFiles);
    } catch (error) {
      onError('حدث خطأ أثناء معالجة الملفات. يرجى المحاولة مرة أخرى.');
    }
  }, [onFilesAccepted, onError]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': SUPPORTED_FILE_TYPES.images,
      'video/*': SUPPORTED_FILE_TYPES.videos,
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf']
    },
    maxFiles: Math.max(MAX_UPLOAD_FILES, MAX_UPLOAD_VIDEOS, MAX_UPLOAD_DOCUMENTS),
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => {
      setIsDragging(false);
      onError('بعض الملفات غير مدعومة أو تجاوزت الحد المسموح.');
    }
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
        ${isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
    >
      <input {...getInputProps()} />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        اسحب وأفلت الملفات هنا، أو انقر للاختيار
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        يمكنك رفع حتى {MAX_UPLOAD_FILES} صورة، {MAX_UPLOAD_VIDEOS} فيديو، و {MAX_UPLOAD_DOCUMENTS} مستند
      </p>
    </div>
  );
};

export default FileUpload;