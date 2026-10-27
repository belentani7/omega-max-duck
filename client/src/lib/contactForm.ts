/** Normalize the public contact form before sending it to the tRPC API. */
export function readContactPayload(data: FormData) {
  const readText = (name: string) => {
    const value = data.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  return {
    name: readText("name"),
    email: readText("email"),
    service: readText("service") || undefined,
    message: readText("message"),
  };
}
