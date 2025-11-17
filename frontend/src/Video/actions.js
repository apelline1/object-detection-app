export const RESET_VIDEO = "Video.RESET_VIDEO";
export const resetVideo = () => ({
  type: RESET_VIDEO,
  payload: {},
});

export const SEND_IMAGE = "Video.SEND_IMAGE";
export const sendImage = (image, userId, date, time) => ({
  type: SEND_IMAGE,
  payload: {
    image,
    userId,
    date,
    time,
  },
});

export const SEND_VIDEO = "Video.SEND_VIDEO";
export const sendVideo = (video, userId, date, time) => ({
  type: SEND_VIDEO,
  payload: {
    video,
    userId,
    date,
    time,
  },
});
