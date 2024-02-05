import { MdOutlineClose } from "react-icons/md";
import { Badge } from "@chakra-ui/layout";
import { Icon } from "@chakra-ui/react";
import { RiAdminFill } from "react-icons/ri";

const UserBadgeItem = ({ handleFunction, user, admin }) => {
  return (
    <Badge
      px={2}
      py={1}
      borderRadius="lg"
      m={1}
      mb={2}
      variant="solid"
      fontSize={14}
      display={"flex"}
      alignItems={"center"}
      gap={1}
      textTransform={"capitalize"}
      colorScheme="purple"
      cursor="pointer"
      onClick={handleFunction}
    >
      {user.name}
      {admin._id === user._id && <Icon as={RiAdminFill} color={"red"} />}
      <Icon as={MdOutlineClose} />
    </Badge>
  );
};

export default UserBadgeItem;
