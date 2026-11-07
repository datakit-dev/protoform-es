import { type Env, EnvContext } from "../env";

export function EnvProvider({ env, children }: React.PropsWithChildren<{
  env: Env;
}>) {
  return (
    <EnvContext.Provider value={env}>
      {children}
    </EnvContext.Provider>
  );
}
