const express = require("express");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const jwt = require("jsonwebtoken");

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

const JWT_SECRET = "secret";

let users = [
  { id: 1, name: "Alice", email: "alice@email.com", password: "alice123", role: "ADMIN" },
  { id: 2, name: "Bob", email: "bob@email.com", password: "bob123", role: "USER" }
];


function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. Token missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
}

function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Access forbidden: insufficient privileges." });
    }
    next();
  };
}


app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role:user.role }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});



app.get("/users", authenticateToken, authorizeRole("ADMIN"), (req, res) => {
  /* 
    #swagger.tags = ['Users']
    #swagger.responses[200] = {
      description: 'List of all users',
      schema: [{ $ref: '#/definitions/GetUser' }]
    }
  */
  const usersWithoutPassword = users.map(({ password, ...rest }) => rest);
  res.json(usersWithoutPassword);
});



app.get("/users/:id", authenticateToken, (req, res) => {
  /* 
    #swagger.tags = ['Users']
    #swagger.parameters['id'] = { description: 'ID of the user', required: true }
    #swagger.responses[200] = {
      description: 'Single user',
      schema: { $ref: '#/definitions/GetUser' }
    }
    #swagger.responses[404] = { description: 'User not found' }
  */

  if (req.user.id != req.params.id) {
    return res.status(403).json({ error: "Access forbidden: cannot view other users." });
  }

  const user = users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});



app.post("/users", (req, res) => {
  /* 
    #swagger.tags = ['Users']
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'New user object',
      required: true,
      schema: { $ref: '#/definitions/CreateUser' }
    }
    #swagger.responses[201] = { description: 'User created successfully', schema: { $ref: '#/definitions/GetUser'} }
    #swagger.responses[400] = { description: 'Name and email are required' }
    #swagger.responses[409] = { description: 'Email already exists' }
  */
 
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  // check if email already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: "Email already exists." });
  }

  // create new user
  const newUser = {
    id: users.length + 1,
    name,
    email
  };

  users.push(newUser);
  res.status(201).json(newUser);
});


app.put("/users/:id", (req, res) => {
  /* 
    #swagger.tags = ['Users']
    #swagger.parameters['id'] = { description: 'ID of the user', required: true }
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Updated user object',
      required: true,
      schema: { $ref: '#/definitions/CreateUser' }
    }
    #swagger.responses[204] = { description: 'User updated successfully' }
    #swagger.responses[400] = { description: 'Name and email are required' }
    #swagger.responses[404] = { description: 'User not found' }
  */
  const userId = parseInt(req.params.id);
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // check if another user already has the same email
  const emailTaken = users.find(u => u.email === email && u.id !== userId);
  if (emailTaken) {
    return res.status(409).json({ error: "Email already exists." });
  }

  user.name = name;
  user.email = email;

  res.status(204).send();
});

app.delete("/users/:id", (req, res) => {
  /* 
    #swagger.tags = ['Users']
    #swagger.parameters['id'] = { description: 'ID of the user', required: true }
    #swagger.responses[204] = { description: 'User deleted successfully' }
    #swagger.responses[404] = { description: 'User not found' }
  */
  const userId = parseInt(req.params.id);

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  users.splice(users.indexOf(user), 1);

  res.status(204).send();
});




app.listen(3003, () => console.log("Users service running on port 3003"));
