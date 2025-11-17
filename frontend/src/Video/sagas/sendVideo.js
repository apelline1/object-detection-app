import { call, put, takeEvery } from "redux-saga/effects";
import { sendOutgoingMessage } from "../../Socket/actions";
import { SEND_VIDEO } from "../actions";

import { OUTGOING_MESSAGE_TYPES } from "../../Socket/messageTypes";

function* executeSendVideo(action) {
  yield put(
    sendOutgoingMessage({
      type: OUTGOING_MESSAGE_TYPES.VIDEO,
      ...action.payload,
    })
  );
}

export function* watchSendVideo() {
  yield takeEvery(SEND_VIDEO, executeSendVideo);
}

