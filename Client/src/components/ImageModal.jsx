import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Image,
  Icon,
  Input,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IoIosSend } from "react-icons/io";
import useImageUploader from "../hooks/useImageUploader";

const ImageModal = ({ image, setImage, SendImageHandler }) => {
  //   const [UploadedImg, setUploadedImg] = useState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, getUploadedImg] = useImageUploader();
  const [message, setMessage] = useState();
  //   console.log(image);

  useEffect(() => {
    if (image) {
      onOpen();
    }
    // eslint-disable-next-line
  }, [image]);

  const closeModal = () => {
    onClose();
    setImage(null);
  };

  const UploadAndSendImageHandler = async () => {
    const uploadedImgPromise = getUploadedImg(image);

    uploadedImgPromise
      .then((UploadedImg) => {
        //   console.log(UploadedImg);
        if (UploadedImg) {
          SendImageHandler(`${UploadedImg}{&caption&}${message}`);
          onClose();
          setImage(null);
        } else {
          return;
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // console.log(image);

  return (
    <>
      <Modal onClose={closeModal} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent mx={"5px"}>
          <ModalHeader
            fontSize="22px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
            pb={2}
          >
            Send Image
          </ModalHeader>
          <ModalCloseButton onClose={closeModal} />
          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="space-between"
            pb={0}
          >
            <Image
              boxSize="110px"
              src={image && URL.createObjectURL(image)}
              alt="Image to send"
              mb={4}
              width={"70%"}
              h={"70%"}
              objectFit={"cover"}
            />
            <Input
              type="text"
              placeholder="Message..."
              autoComplete="off"
              mb={3}
              onChange={(e) => setMessage(e.target.value)}
            />
          </ModalBody>
          <ModalFooter
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            pt={1}
          >
            <Button
              onClick={UploadAndSendImageHandler}
              py={6}
              px={2}
              borderRadius={"full"}
              isLoading={isLoading}
            >
              <Icon
                as={IoIosSend}
                fontSize={30}
                color={"#865DFF"}
                cursor={"pointer"}
              />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ImageModal;
