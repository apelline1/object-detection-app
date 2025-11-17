import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getStatus } from "../actions";
import Routes from "../../Routes";

import "./App.scss";

function App() {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.appReducer?.status);

  useEffect(() => {
    dispatch(getStatus());
  }, [dispatch]);

  return (
    <div className="app">
      <Routes />
    </div>
  );
}

export default App;
