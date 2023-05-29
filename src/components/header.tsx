import { Show, createSignal, onMount } from "solid-js";
import {
  AuthApi,
  BASE_PATH,
  Configuration,
  DefaultConfig,
  UserApi,
  UserResponseDTO,
} from "~/api";
import { useMe } from "./context/me";

const HeaderComponent = () => {
  const [username, setUsername] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");
  const [me, setMe] = useMe();

  const loginHandler = async () => {
    const loginResponse = await new AuthApi().authControllerLogin({
      loginDTO: { username: username(), password: password() },
    });
    const accessToken = loginResponse.accessToken;
    localStorage.setItem("accessToken", accessToken);
    if (accessToken != null) {
      DefaultConfig.config = new Configuration({ accessToken });
    }
    const me = await new UserApi().usersControllerGetMe();
    setMe(me);
  };

  const logoutHandler = async () => {
    localStorage.removeItem("accessToken");
    DefaultConfig.config = new Configuration();
    setMe(null);
  };

  onMount(async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken != null) {
      const me = await new UserApi().usersControllerGetMe();
      setMe(me);
    }
  });

  return (
    <div class="flex flex-row justify-between items-center">
      <div class="m-4 text-xl">Solid Nacho</div>
      <Show when={me() == null}>
        <div class="flex flex-row gap-4 m-4 h-11">
          <input
            type="text"
            placeholder="Username"
            onInput={(e) => setUsername(e.target.value)}
            class="input w-full max-w-xs"
          />
          <input
            type="password"
            placeholder="Password"
            onInput={(e) => setPassword(e.target.value)}
            class="input w-full max-w-xs"
          />
          <button class="btn" onClick={loginHandler}>
            Login
          </button>
        </div>
      </Show>
      <Show when={me() != null}>
        <div class="avatar m-4 h-11" onClick={logoutHandler}>
          <div class="w-10 rounded-full">
            <img src={BASE_PATH + "/app/user/avatar/" + me().id}></img>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default HeaderComponent;
