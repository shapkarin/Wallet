import { json } from "@remix-run/node";

export const loader = () => {
  return json({ message: "Not Found" }, { status: 404 });
};

export default function CatchAll() {
  return null;
}
