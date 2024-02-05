import { useToast } from "@chakra-ui/react";
import { useState } from "react";

const useImageUploader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  async function getUploadedImg(image) {
    setIsLoading(true);

    if (!image) {
      toast({
        title: "Please Select Image.",
        description: "Image is not provided",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      setIsLoading(false);
      return;
    }

    if (
      image.type === "image/jpeg" ||
      image.type === "image/png" ||
      image.type === "image/jpg"
    ) {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", import.meta.env.VITE_UPLOAD_PRESET);
      formData.append("cloud_name", import.meta.env.VITE_CLOUD_NAME);

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${
            import.meta.env.VITE_CLOUD_NAME
          }/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        return data.url.toString();
      } catch (error) {
        console.error(error);

        toast({
          title: "Error Uploading Image",
          description: "An error occurred while uploading the image.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);

      toast({
        title: "Please Select right Image format",
        description: "format should be in these types: jpeg, jpg, png.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  }

  return [isLoading, getUploadedImg];
};

export default useImageUploader;
