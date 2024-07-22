import "dotenv/config";
import { sendMail } from "./lib/email";
import { ttlStore } from "./lib/store";
import { request } from "./lib/request";
import Fastify from "fastify";
import cors from "@fastify/cors";

async function main() {
  const app = Fastify({
    logger: true,
  });

  await app.register(import("@fastify/rate-limit"), {
    max: 30,
    timeWindow: "1 minute",
  });
  await app.register(cors, {
    // put your options here
  });

  app.setErrorHandler(function (error, request, reply) {
    if (error.statusCode === 429) {
      reply.code(429);
      error.message = "请求发送太频繁!";
    }
    reply.send(error);
  });

  app.get("/", function (req, res) {
    res.send("Hello World");
  });
  app.get("/notifications", async function (req, res) {
    const response = await request("notifications?sort=publishedAt:desc");
    const notifications = await response.json();
    return res.send(notifications);
  });
  app.get(
    "/notifications/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
          },
        },
      },
    },
    async function (req, res) {
      //@ts-ignore
      const { id } = req.params;
      const response = await request(`notifications/${id}`);
      const notification = await response.json();
      return res.send(notification);
    }
  );
  app.post(
    "/createAccount",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "code", "address"],
          properties: {
            email: { type: "string" },
            code: { type: "string" },
            address: { type: "string"}
          },
        },
      },
    },
    async function (req, res) {
      //@ts-ignore
      const { email, code, address } = req.body;
      const savedCode = ttlStore.get(email);
      if (String(savedCode) !== String(code)) {
        console.log('savedCode', email, savedCode, code);
        return res.status(400).send({
          message: "验证码错误"
      });
      }
      const accountExists = await request(
        "accounts?filters[email][$eq]=" + email
      ).then((res) => res.json());
      if (accountExists.data.length) {
        return res.status(400).send({
            message: "账号已存在"
        });
      }
      const response = await request("accounts", {
        method: "POST",
        body: JSON.stringify({
           data: {
            email,
            address
           }
        }),
      });
      const account = await response.json();
      console.log('account', account);
      return res.send(account);
    }
  );
  app.get(
    "/getCode",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            email: { type: "string" },
          },
        },
      },
    },
    async function (req, res) {
      //@ts-ignore
      const { email } = req.query;
      await sendMail(email);
    }
  );
  app.listen(
    {
      port: 3000,
    },
    (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server listening at ${address}`);
    }
  );
}

main();
