require("dotenv").config();
const http = require("http");
const AppDataSource = require("./db");
const {
  ReturningResultsEntityUpdator,
} = require("typeorm/query-builder/ReturningResultsEntityUpdator.js");
const { isDataView } = require("util/types");

// 判斷是否為字串跟是不是空的
const isValidString = (value) => {
  return typeof value === "string" && value.trim() !== "";
};

// 判斷是不是數字
const isNumber = (value) => {
  return typeof value === "number" && !isNaN(value);
};

const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json",
  };
  let body = "";

  // 把 body 的資料加到 body 裡面
  req.on("data", (chunk) => {
    body += chunk;
  });

  if (req.url === "/api/credit-package" && req.method === "GET") {
    try {
      const data = await AppDataSource.getRepository("CreditPackage").find({
        select: ["id", "name", "credit_amount", "price"],
      });
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: data,
        })
      );
      res.end();
    } catch (error) {
      res.writeHead(500, headers);
      res.write(
        JSON.stringify({
          status: "error",
          message: "伺服器錯誤",
        })
      );
      res.end();
    }
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const { name, credit_amount, price } = JSON.parse(body);
        // 檢查是否有填寫正確
        if (
          !isNumber(credit_amount) ||
          !isNumber(price) ||
          !isValidString(name)
        ) {
          res.writeHead(400, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "欄位未填寫正確",
            })
          );
          res.end();
          return;
        }

        // 檢查是否有重複的名稱
        const creditPacakge = AppDataSource.getRepository("CreditPackage");
        const findCreditPackage = await creditPacakge.find({
          where: { name: name },
        });
        if (findCreditPackage.length > 0) {
          res.writeHead(400, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "此套餐已存在",
            })
          );
          res.end();
          return;
        }

        const newCreditPackage = creditPacakge.create({
          name,
          credit_amount,
          price,
        });

        const result = await creditPacakge.save(newCreditPackage);

        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "success",
            data: result,
          })
        );
        res.end();
      } catch {
        res.writeHead(500, headers);
        res.write(
          JSON.stringify({
            status: "error",
            message: "伺服器錯誤",
          })
        );
        res.end();
      }
    });
  } else if (
    req.url.startsWith("/api/credit-package/") &&
    req.method === "DELETE"
  ) {
    try {
      const creditPackageId = req.url.split("/").pop();

      if (!isValidString(creditPackageId)) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "failed",
            message: "ID錯誤",
          })
        );
        res.end();
        return;
      }

      const result = await AppDataSource.getRepository("CreditPackage").delete(
        creditPackageId
      );
      if (result.affected === 0) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "failed",
            message: "ID錯誤",
          })
        );
        res.end();
        return;
      }

      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
        })
      );
      res.end();
    } catch {
      res.writeHead(500, headers);
      res.write(
        JSON.stringify({
          status: "error",
          message: "伺服器錯誤",
        })
      );
      res.end();
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "GET") {
    try {
      const data = await AppDataSource.getRepository("Skill").find({
        select: ["id", "name", "createdAt"],
      });
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: data,
        })
      );
      res.end();
    } catch (error) {
      res.writeHead(500, headers);
      res.write(
        JSON.stringify({
          status: "error",
          message: "伺服器錯誤",
        })
      );
      res.end();
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "POST") {
    req.on("end", async () => {
      try {
        // 檢查名稱是否有效
        const { name } = JSON.parse(body);
        if (!isValidString(name)) {
          res.writeHead(400, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "欄位未填寫正確",
            })
          );
          res.end();
          return;
        }

        // 檢查技能重複存在
        const findSkill = await AppDataSource.getRepository("Skill").find({
          where: { name: name },
        });
        if (findSkill.length > 0) {
          res.writeHead(409, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "資料重複",
            })
          );
          res.end();
          return;
        }

        // 新增資料
        const newSkill = AppDataSource.getRepository("Skill").create({
          name,
        });
        const result = await AppDataSource.getRepository("Skill").save(
          newSkill
        );
        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "success",
            data: result,
          })
        );
        res.end();
      } catch (error) {
        res.writeHead(500, headers);
        res.write(
          JSON.stringify({
            status: "error",
            message: "伺服器錯誤",
          })
        );
        res.end();
      }
    });
  } else if (
    req.url.startsWith("/api/coaches/skill/") &&
    req.method === "DELETE"
  ) {
    try {
      const skillId = req.url.split("/").pop();
      if (!isValidString(skillId)) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "failed",
            message: "ID錯誤",
          })
        );
        res.end();
        return;
      }

      const result = await AppDataSource.getTreeRepository("Skill").delete(
        skillId
      );
      // 檢查是不是有這筆 id 的資料
      if (result.affected === 0) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "failed",
            message: "ID錯誤",
          })
        );
        res.end();
        return;
      }

      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
        })
      );
      res.end();
    } catch {
      res.writeHead(500, headers);
      res.write(
        JSON.stringify({
          status: "error",
          message: "伺服器錯誤",
        })
      );
      res.end();
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers);
    res.write(
      JSON.stringify({
        status: "failed",
        message: "無此網站路由",
      })
    );
    res.end();
  }
};

const server = http.createServer(requestListener);

async function startServer() {
  await AppDataSource.initialize();
  console.log("資料庫連接成功");
  server.listen(process.env.PORT);
  console.log(`伺服器啟動成功,ort: ${process.env.PORT}`);
  return server;
}

module.exports = startServer();
