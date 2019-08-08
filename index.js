const { ApolloServer } = require('apollo-server')
const { GraphQLScalarType } = require('graphql')

const typeDefs = `
# добавляем определиене типа Photo
  
  enum PhotoCategory {
    SELFIE
    PORTRAIT
    ACTION
    LANDSCAPE
    GRAPHIC
  }

  type User {
    githubLogin: ID!
    name: String
    avatar: String
    postedPhotos: [Photo!]!
    inPhotos: [Photo!]
  }

  scalar DateTime  

  type Photo {
    id: ID!
    url: String!
    name: String!
    description: String
    category: PhotoCategory!
    postedBy: User!
    taggedUsers: [User!]!
    created: DateTime!
  }

  input PostPhotoInput {
    name: String!
    category: PhotoCategory=PORTRAIT
    description: String
  }

  type Query {
    totalPhotos: Int!
    allPhotos: [Photo!]!
  }

  type Mutation {
    postPhoto(input: PostPhotoInput!): Photo!
  }

`

var _id = 0
var users = [
  {"githubLogin": "mHattrup", "name": "Mike Hattrup"},
  {"githubLogin": "gPlake", "name": "Glen Plake"}, 
  {"githubLogin": "sSchmidt", "name": "Scot Schmidt"}, 
  {"githubLogin": "sS", "name": "Scot"}, 

]

var photos = [
  {
    "id": "1",
    "name": "Dropping the Heart Chute",
    "description": "The heat chute is one of my favorite chutes",
    "category": "ACTION",
    "githubUser": "gPlake",
    "created": "3-28-1977"
  },
  {
    "id": "2",
    "name": "Enjoying the sunshine",
    "category": "SELFIE",
    "githubUser": "sSchmidt",
    "created": "1-2-1985"

  },
  {
    "id": "3",
    "name": "Gunbarrel 25",
    "description": "25 laps on gunbarrel today",
    "category": "LANDSCAPE",
    "githubUser": "sSchmidt",
    "created": "2018-04-15T19:09:57.308Z"
  }
]

var tags = [
  {"photoID": "1", "userID": "gPlake"},
  {"photoID": "2", "userID": "sSchmidt"},
  {"photoID": "2", "userID": "mHattrup"},
  {"photoID": "2", "userID": "gPlake"},

]

const resolvers = {
  Query: {
    totalPhotos: () => photos.length,
    allPhotos: () => photos
  },
  Mutation: {
    postPhoto(parent, args){
      var newPhoto = {
        id: _id++,
        ...args.input
      }
      photos.push(newPhoto)
      return newPhoto
    }
  },
  Photo: {
    url: parent => `https://yoursite.com/img/${parent.id}.jpg`,
    postedBy: parent => {
      return users.find(u => u.githubLogin === parent.githubUser)
    },
    taggedUsers: parent => tags
      .filter(tag => tag.photoID === parent.id)// возвращает массив тегов которые содеражат только текущую фотографию
      .map(tag => tag.userID) // преобразует маасив тэгов в массив значений userID
      .map(userID => users.find(u => u.githubLogin === userID)) // преобразует массив значений userID в массив объектов пользователей
  },
  User: {
    postedPhotos: parent => {
      return photos.filter(p => p.githubUser === parent.githubLogin)
    },
    inPhotos: parent => tags
      .filter(tag => tag.userID === parent.githubLogin) 
      .map(tag => tag.photoID)
      .map(photoID => photos.find(p => p.id === photoID)) 
  },
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'A valid date time value',
    parseValue: value => new Date(value),
    serialize: value => new Date(value).toISOString(),
    parseLiteral: ast => ast.value
  })
}

//создаем аполло-сервер и передаем ему схему (typeDefs) и распознаватель (resolvers)
const server = new ApolloServer({
  typeDefs,
  resolvers
})

//вызываем отслеживание на сервере для запуска веб-сервера
server
  .listen()
  .then(({url}) => console.log(`GraphQL Service running on ${url}`))
