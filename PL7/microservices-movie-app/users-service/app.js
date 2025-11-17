const express = require("express");
const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(express.json());

const jwt = require("jsonwebtoken");
const JWT_SECRET = "xfdcgmk98iojkwkow";

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
}

function autorizarPapel(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Access denied: insufficient role." });
    }
    next();
  };
  }

let users = [
  { id: 1, name: "Alice", email: "alice@email.com", password: "password123", role: "admin" },
  { id: 2, name: "Bob", email: "bob@email.com", password: "password456", role: "user" },
];

app.get("/users", autenticarToken, autorizarPapel("admin"), (req, res) => {
  const noPasswords = users.map(({ password, ...rest }) => rest);
  res.json(noPasswords);

  /* #swagger.tags = ['Users']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = {
       description: 'List of users',
       schema: [{ $ref: '#/definitions/User' }]
     }
     #swagger.responses[401] = { description: 'Missing token.' }
     #swagger.responses[403] = { description: 'Access denied: insufficient role.' }
  */
});

app.get("/users/:id", autenticarToken, (req, res) => {
  const userId = parseInt(req.params.id);
  if (req.user.id !== userId && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access forbidden: not your profile." });
  }

  const user = users.find(u => u.id === userId);
  user ? res.json(user) : res.status(404).json({ error: "User not found." });

  /* #swagger.tags = ['Users']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID of the user',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: 'User obtained successfully',
       schema: { $ref: '#/definitions/User' }
     }
     #swagger.responses[401] = { description: 'Missing token.' }
     #swagger.responses[403] = { description: 'Access forbidden: not your profile.' }
     #swagger.responses[404] = { description: 'User not found.' }
  */
});

app.put("/users/:id", autenticarToken, (req, res) => {
  const userId = parseInt(req.params.id);

  // Only the user themselves or an admin can edit
  if (req.user.id !== userId && req.user.role !== "admin") {
    return res.status(403).json({ error: "You do not have permission to edit this user." });
  }

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const { name, email } = req.body;
  if (email && users.some(u => u.email === email && u.id !== user.id)) {
    return res.status(409).json({ error: "Email already exists." });
  }

  user.name = name || user.name;
  user.email = email || user.email;
  res.json(user);
  
  /* #swagger.tags = ['Users']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID of the user',
       required: true,
       type: 'integer'
     }
     #swagger.parameters['body'] = {
       in: 'body',
       description: 'Updated user data',
       required: true,
       schema: { $ref: '#/definitions/UserUpdate' }
     }
     #swagger.responses[200] = {
       description: 'User updated successfully',
       schema: { $ref: '#/definitions/User' }
     }
     #swagger.responses[401] = { description: 'Missing token.' }
     #swagger.responses[403] = { description: 'You do not have permission to edit this user.' }
     #swagger.responses[404] = { description: 'User not found.' }
     #swagger.responses[409] = { description: 'Email already exists.' }
  */
});

app.delete("/users/:id", autenticarToken, (req, res) => {
  const userId = parseInt(req.params.id);

  // Only the user themselves or an admin can delete
  if (req.user.id !== userId && req.user.role !== "admin") {
    return res.status(403).json({ error: "You do not have permission to delete this user." });
  }

  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return res.status(404).json({ error: "User not found." });

  users.splice(index, 1);
  res.status(200).json({ message: "User successfully deleted." });

  /* #swagger.tags = ['Users']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID of the user',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = { description: 'User successfully deleted.' }
     #swagger.responses[401] = { description: 'Missing token.' }
     #swagger.responses[403] = { description: 'You do not have permission to delete this user.' }
     #swagger.responses[404] = { description: 'User not found.' }
  */  
});

app.post("/register", (req, res) => {
  const { name, email, password, role = "user" } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required." });

  const exists = users.find(u => u.email === email);
  if (exists) return res.status(409).json({ error: "Email already exists." });

  const newUser = { id: users.length + 1, name, email, password, role };
  users.push(newUser);
  res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });

  /* #swagger.tags = ['Users']
     #swagger.parameters['body'] = {
       in: 'body',
       description: 'New user data',
       required: true,
       schema: { $ref: '#/definitions/UserInput' }
     }
     #swagger.responses[201] = {
       description: 'User registered successfully',
       schema: { $ref: '#/definitions/User' }
     }
     #swagger.responses[400] = { description: 'Name, email, and password are required.' }
     #swagger.responses[409] = { description: 'Email already exists.' }
  */
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials." });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token });

  /* #swagger.tags = ['Users']
     #swagger.parameters['body'] = {
       in: 'body',
       description: 'User login credentials',
       required: true,
       schema: { $ref: '#/definitions/UserLogin' }
     }
     #swagger.responses[200] = {
       description: 'Login successful',
       schema: { type: 'object', properties: { token: { type: 'string' } } }
     }
     #swagger.responses[401] = { description: 'Invalid credentials.' }
  */  
});

app.listen(3003, () => console.log("Users service running on port 3003"));
