const express = require("express");
const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(express.json());

let users = [
  { id: 1, name: "Alice", email: "alice@email.com" },
  { id: 2, name: "Bob", email: "bob@email.com" }
];

app.get("/users", (req, res) => {
  /*
#swagger.tags = ['Users']
#swagger.responses[200] = {
  description: 'List of all users',
  schema: [{ $ref: '#/definitions/GetUser' }]
}
*/
  res.json(users)
});

app.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  user ? res.json(user) : res.status(404).json({ error: "User not found" });

  /*
#swagger.tags = ['Users']
#swagger.parameters['id'] = {
  in: 'path',
  description: 'ID do utilizador',
  required: true,
  type: 'integer'
}
#swagger.responses[200] = {
  description: 'Utilizador obtido com sucesso',
  schema: { $ref: '#/definitions/GetUser' }
}
#swagger.responses[404] = { description: 'Utilizador não encontrado' }
*/
});



// Criar utilizador
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

  const exists = users.find(u => u.email === email);
  if (exists) return res.status(409).json({ error: "Email already exists" });

  const newUser = { id: users.length + 1, name, email };
  users.push(newUser);
  res.status(201).json(newUser);

  /*
#swagger.tags = ['Users']
#swagger.parameters['body'] = {
  in: 'body',
  description: 'Novo utilizador',
  required: true,
  schema: { $ref: '#/definitions/CreateUser' }
}
#swagger.responses[201] = {
  description: 'Utilizador criado com sucesso',
  schema: { $ref: '#/definitions/GetUser' }
}
#swagger.responses[409] = { description: 'Email já existe' }
*/
});


// Atualizar utilizador
app.put("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });

  const { name, email } = req.body;
  if (email && users.some(u => u.email === email && u.id !== user.id)) {
    return res.status(409).json({ error: "Email already exists" });
  }

  user.name = name || user.name;
  user.email = email || user.email;
  res.json(user);
  /*
#swagger.tags = ['Users']
#swagger.parameters['id'] = {
  in: 'path',
  description: 'ID do utilizador',
  required: true,
  type: 'integer'
}
#swagger.parameters['body'] = {
  in: 'body',
  description: 'Dados atualizados do utilizador',
  required: true,
  schema: { $ref: '#/definitions/CreateUser' }
}
#swagger.responses[200] = {
  description: 'Utilizador atualizado com sucesso',
  schema: { $ref: '#/definitions/GetUser' }
}
#swagger.responses[404] = { description: 'Utilizador não encontrado' }
#swagger.responses[409] = { description: 'Email já existe' }
*/

});

// Eliminar utilizador
app.delete("/users/:id", (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "User not found" });

  users.splice(index, 1);
  res.status(200).json({ message: "User deleted" });

  /*
  #swagger.tags = ['Users']
  #swagger.parameters['id'] = {
    in: 'path',
    description: 'ID do utilizador',
    required: true,
    type: 'integer'
  }
  #swagger.responses[200] = { description: 'Utilizador eliminado com sucesso' }
  #swagger.responses[404] = { description: 'Utilizador não encontrado' }
  */
});


app.listen(3003, () => console.log("Users service running on port 3003"));
