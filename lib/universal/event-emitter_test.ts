import { testingAsserts as ta } from "../../deps-test.ts";
import { EventEmitter } from "./event-emitter.ts";

Deno.test("EventEmitter should be defined and emit", async () => {
  const emitted = new Map<"cmd1" | "cmd2" | "cmd3" | "cmd4", number>();
  emitted.set("cmd1", 0);
  emitted.set("cmd2", 0);
  emitted.set("cmd3", 0);
  emitted.set("cmd4", 0);

  const increment = (key: "cmd1" | "cmd2" | "cmd3" | "cmd4") => {
    emitted.set(key, emitted.get(key)! + 1);
  };

  class SyntheticEE extends EventEmitter<{
    cmd1(arg: string): void;
    cmd2(arg1: number, arg2: number): Promise<void>;
    cmd3(): void;
    cmd4(): Promise<void>;
  }> {
    constructor() {
      super();
      // this is ugly but necessary due to events.EventEmitter making _events_ private :-(
      this.on("cmd1", (_arg) => increment("cmd1"));
      // deno-lint-ignore require-await
      this.on("cmd2", async (_arg1, _arg2) => increment("cmd2"));
      this.on("cmd3", () => increment("cmd3"));
      this.on("cmd4", async () => {
        await this.emit("cmd1", "arg");
        await this.emit("cmd2", 1, 2);
        await this.emit("cmd3");
        increment("cmd4");
      });
    }
  }

  const ee = new SyntheticEE();
  await ee.emit("cmd4");
  ta.assertEquals(Array.from(emitted), [["cmd1", 1], ["cmd2", 1], ["cmd3", 1], [
    "cmd4",
    1,
  ]]);
});
