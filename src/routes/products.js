import { Router } from "express";
import * as fs from "fs";
import socketServer from "../app.js";

const router = Router();
let products = [];

if (fs.existsSync("products.json")) {
  products = JSON.parse(fs.readFileSync("products.json", "utf-8"));
}

router.get("/", (req, res) => {
  res.send(products);
});

router.get("/view", (req, res) => {
  res.render("home", { products });
});

router.get("/realtimeproducts", (req, res) => {
  res.render("realTimesProducts", { products });
});

router.get("/:pid", (req, res) => {
  const idProduct = +req.params.pid;
  const product = products.find((product) => product.id === idProduct);
  if (!product) {
    res.status(404).send({ status: "error", error: "Product not found" });
  } else {
    res.send(product);
  }
});

router.post("/", (req, res) => {
  let newProduct = req.body;

  newProduct = { ...newProduct, id: products.length + 1 };

  if (!newProduct.thumbnails) {
    newProduct = { ...newProduct, thumbnails: [] };
  }

  if (!newProduct.status) {
    newProduct = { ...newProduct, status: true };
  }

  if (
    !newProduct.title ||
    !newProduct.description ||
    !newProduct.code ||
    !newProduct.price ||
    !newProduct.status ||
    !newProduct.stock
  ) {
    return res
      .status(422)
      .send({ status: "error", error: "Incomplete values" });
  }

  products.push(newProduct);
  fs.writeFileSync("products.json", JSON.stringify(products));
  socketServer.sockets.emit("productsRealTimes", { products });
  res.send({ status: "success", message: "Product added correctly" });
});

router.put("/:id", (req, res) => {
  const idProduct = +req.params.id;
  let updateProduct = req.body;

  const i = products.findIndex((product) => product.id === idProduct);

  if (i === -1) {
    return res
      .status(404)
      .send({ status: "error", error: "Product not found" });
  }

  if (!updateProduct.thumbnails) {
    updateProduct = { ...updateProduct, thumbnails: [] };
  }

  if (
    !updateProduct.title ||
    !updateProduct.description ||
    !updateProduct.code ||
    !updateProduct.price ||
    !updateProduct.status ||
    !updateProduct.stock
  ) {
    return res
      .status(422)
      .send({ status: "error", error: "Incomplete values" });
  }

  updateProduct = { ...updateProduct, id: idProduct };
  products[i] = updateProduct;
  fs.writeFileSync("products.json", JSON.stringify(products));
  res.send({ status: "success", message: "Successfully edited product" });
});

router.delete("/:id", (req, res) => {
  const idProduct = +req.params.id;
  const actualLength = products.length;
  products = products.filter((product) => product.id != idProduct);

  if (products.length === actualLength) {
    return res
      .status(404)
      .send({ status: "error", error: "Product not found" });
  }

  fs.writeFileSync("products.json", JSON.stringify(products));
  socketServer.sockets.emit("productsRealTimes", { products });
  res.send({ status: "success", message: "Product disposed correctly" });
});

export default router;
