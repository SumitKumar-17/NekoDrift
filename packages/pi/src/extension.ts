import { createNekoDriftPiExtension, type NekoDriftPiOptions } from "./runtime.js";

export default function openPetsPiExtension(pi: unknown, options: NekoDriftPiOptions = {}): void {
  createNekoDriftPiExtension(pi, options);
}
