import { Signal, createContext, createSignal, useContext } from "solid-js";
import { UserResponseDTO } from "~/api";

const MeContext = createContext<Signal<UserResponseDTO | null>>();

export const MeProvider = (props) => {
  const signal = createSignal<UserResponseDTO | null>(null);

  return (
    <MeContext.Provider value={signal}>{props.children}</MeContext.Provider>
  );
};

export const useMe = () => {
  return useContext(MeContext);
};
