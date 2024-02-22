import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
const app = express()
const port = 3000

//how to using req.body
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

databaseService.connect()

app.use('/users', usersRouter)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
