
import { TTLStore, ttlStore } from "./store";

function getRandomSixDigitNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}


// async..await is not allowed in global scope, must use a wrapper
export async function sendMail(to: string) {
  const code = ttlStore.get(to) || getRandomSixDigitNumber()
  console.log('code', code, to, process.env.EMAIL_API_KEY)
  const res = await fetch('https://www.aoksend.com/index/api/send_email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_key: process.env.EMAIL_API_KEY,
      to,
      template_id: 'E_102481483914',
      data: JSON.stringify({
        code
      }),
    }),
  })
  const data =  await res.json()
  if (data.code !== 200) {
    throw new Error(data.message)
  }
  ttlStore.set(to, code)
};
