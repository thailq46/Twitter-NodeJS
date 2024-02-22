const name: string = 'Lê Quang Thái'
console.log(name)

type Handle = () => Promise<string>

const handle: Handle = () => Promise.resolve(name)

handle().then(console.log)
