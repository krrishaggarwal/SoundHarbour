import { createContext, useReducer } from "react";
export const QueueContext = createContext();

const queueReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_QUEUE":
      if (state.find((s) => s.fileId === action.payload.fileId)) return state;
      return [...state, action.payload];
    case "REMOVE_FROM_QUEUE":
      return state.filter((s) => s.fileId !== action.payload);
    case "CLEAR_QUEUE":
      return [];
    default:
      return state;
  }
};

const listReducer = (state, action) => {
  switch (action.type) {
    case "ADD_SONG":
      if (state.find((s) => s.fileId === action.payload.fileId)) return state;
      return [...state, action.payload];
    case "REMOVE_SONG":
      return state.filter((s) => s.fileId !== action.payload);
    case "CLEAR_LIST":
      return [];
    default:
      return state;
  }
};
export const QueueContextState = ({ children }) => {
  const [queue, dispatchQueue] = useReducer(queueReducer, []);
  const [list, dispatchList] = useReducer(listReducer, []);

  return (
    <QueueContext.Provider
      value={{
        queue,
        dispatchQueue,
        list,
        dispatchList,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};