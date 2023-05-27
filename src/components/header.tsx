import { Show, createSignal } from "solid-js";
import { AuthApi, BASE_PATH, UserApi, UserResponseDTO } from "~/api";

const HeaderComponent = () => {
  const [user, setUser] = createSignal<UserResponseDTO | null>(null);
  const [username, setUsername] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");

  const loginHandler = async () => {
    const loginResponse = await new AuthApi().authControllerLogin({
      loginDTO: { username: username(), password: password() },
    });
    const me = await new UserApi().usersControllerGetMe({
      headers: { Authorization: "Bearer " + loginResponse.accessToken },
    });
    setUser(me);
  };

  return (
    <div class="flex flex-row justify-between items-center">
      <div class="m-4 text-xl">Solid Nacho</div>
      <Show when={user() == null}>
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
          <button class="btn" onClick={[loginHandler, {}]}>
            Login
          </button>
        </div>
      </Show>
      <Show when={user() != null}>
        <div class="avatar m-4 h-11">
          <div class="w-10 rounded-full">
            <img src={BASE_PATH + "/app/user/avatar/" + user().id}></img>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default HeaderComponent;
