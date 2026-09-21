import { exec } from "child_process";

export default function registerTemperature(pi: any) {
  pi.registerTool({
    name: "get_room_temperature",
    description: "Read the current ambient temperature from the connected Digispark DS18B20 sensor.",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      return new Promise((resolve) => {
        // fast read /dev/ttyACM0 the most updated temperature info
        exec("timeout 1.5s python3 -c \"import serial; s=serial.Serial('/dev/ttyACM0', 9600, timeout=1); print(s.readline().decode().strip()); s.close()\"", (err, stdout) => {
          if (err || !stdout.trim()) {
            return resolve({ content: [{ type: "text", text: "Can't read sensor, please ensure device connect to /dev/ttyACM0" }] });
          }
          resolve({ content: [{ type: "text", text: `感測器回傳：${stdout.trim()}` }] });
        });
      });
    }
  });
}
