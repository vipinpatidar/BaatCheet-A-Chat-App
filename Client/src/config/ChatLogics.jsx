export const isSameSenderMargin = (messages, m, i, userId) => {
  if (
    messages[i]?.sender?._id !== messages[i - 1]?.sender?._id &&
    messages[i]?.sender?._id !== userId
  ) {
    return "3px"; // Align to the left for the first message of the sender
  } else if (messages[i]?.sender?._id === userId)
    return "auto"; // Reset to default (align to the right) for the logged-in user
  else if (i !== 0 || messages[i]?.sender?._id !== messages[i - 1]?.sender?._id)
    return 36 + 8; // Align to the left for other messages
};

export const isSameSender = (messages, m, i, userId) => {
  return (
    (i === 0 || messages[i - 1].sender._id !== m.sender._id) &&
    m.sender._id !== userId
  );
};

export const isFirstMessage = (messages, i, userId) => {
  return (
    i === messages.length - 1 &&
    messages[i].sender._id !== userId &&
    !messages.some(
      (msg, index) => index < i && msg.sender._id === messages[i].sender._id
    )
  );
};

export const isSameUser = (messages, m, i) => {
  return i > 0 && messages[i - 1].sender._id === m.sender._id;
};

export const getSender = (loggedInUser, users) => {
  return users[0]._id === loggedInUser._id ? users[1].name : users[0].name;
};

export const getSenderImage = (loggedInUser, users) => {
  return users[0]._id === loggedInUser._id ? users[1].image : users[0].image;
};

export const getSenderFullInfo = (loggedInUser, users) => {
  return users[0]._id === loggedInUser._id ? users[1] : users[0];
};
