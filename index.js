const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.port || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mess-management.lmhnwjz.mongodb.net/?retryWrites=true&w=majority`;
app.use(cors());
app.use(express.json());







function verifyToken(req, res, next) {
  const bearerHeader = req.headers.authorization;

  if (!bearerHeader) {
    return res.status(403).json({ message: "forbidden" });
  }
  const token = bearerHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "forbidden" });
    }
    req.decoded = decoded;
    next();
  });

  // if (typeof bearerHeader !== "undefined") {
  //   const bearer = bearerHeader.split(" ");
  //   const bearerToken = bearer[1];
  //   req.token = bearerToken;
  //   next();
  // } else {
  //   res.sendStatus(403);
  // }
}

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// client.connect((err) => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

app.get("/", (req, res) => {
  res.send("welcome to amin mess");
});

async function run() {
  try {
    const usersCollection = client.db("mess").collection("users");
    

    //login

    app.post("/user", async (req, res) => {
      const user = req.body;
      const uid = user.uid;
      const query = { uid: uid };
      const isAvailable = await usersCollection.findOne(query);
      if (isAvailable) {
        res.send(isAvailable);
        console.log(isAvailable);
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find({});
      const users = await cursor.toArray();
      res.send(users);
    });
    app.get("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { uid: id };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //remove user
    app.delete("/admin/deleteUser/:id", verifyToken, async (req, res) => {
      const decodecUid = req.decoded.uid;
      const filter = { uid: decodecUid };
      const userId = await usersCollection.findOne(filter);
      if (userId.role !== "admin") {
        return res.status(403).json({ message: "forbidden" });
      }

      const id = req.params.id;
      const query = { uid: id };
      //get user
      const user = await usersCollection.findOne(query);
      if (user?.status == "superAdmin") {
        return res.status(403).json({ message: "forbidden" });
      }
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/users/admin/:id", verifyToken, async (req, res) => {
      const decodecUid = req.decoded.uid;
      const filter = { uid: decodecUid };
      const userId = await usersCollection.findOne(filter);
      if (userId.role !== "admin") {
        return res.status(403).json({ message: "forbidden" });
      }
      const id = req.params.id;
      console.log(id);
      const query = { uid: id };
      console.log(query);
      // const user = req.body;
      // console.log(user);
      // this option instructs the method to create a document if no documents match the filter
      const options = { upsert: true };
      //check if user is admin or not
      const user = await usersCollection.findOne(query);
      console.log(user);
      if (user?.status == "superAdmin") {
        const updatedUser = {
          $set: {
            role: "admin",
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updatedUser,
          options
        );
        console.log(result);
        res.send(result);
      } else if (user?.role == "admin") {
        const updatedUser = {
          $set: {
            role: user?.userAbout,
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updatedUser,
          options
        );
        console.log(result);
        res.send(result);
      } else {
        const updatedUser = {
          $set: {
            role: "admin",
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updatedUser,
          options
        );
        console.log(result);
        res.send(result);
      }
    });

    app.get("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { uid: id };
      const result = await usersCollection.findOne(query);
      res.send({ isAdmin: result?.role === "admin" });
    });

    app.get("/jwt", async (req, res) => {
      const uid = req.query.uid;
      const query = { uid: uid };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign(
          { email: user?.email, uid: user?.uid },
          process.env.ACCCESS_TOKEN,
          { expiresIn: "10h" }
        );
        res.send({ token: token });
      } else {
        res.status(403).send({ token: "" });
      }
      // console.log(user);
    });
  } finally {
  }
}
run().catch((error) => console.log(error));

//user: paradox
//pass: 377YHXpwieeNdmeR

app.listen(5000, () => {
  console.log("Server has started on port 5000");
});





