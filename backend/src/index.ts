import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { bearerAuth } from 'hono/bearer-auth'
import { decode, sign, verify } from "hono/jwt"

const api = new Hono().basePath('/api/v1')
interface Env {
    DATABASE_URL: string;
}

declare module 'hono' {
    interface HonoRequest {
        userId?: string;
    }
}

api.get('/blog/:id', (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: (c.env as Env).DATABASE_URL,
    }).$extends(withAccelerate())
    return c.text('GET /')
})
api.get('/blog/bulk', (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: (c.env as Env).DATABASE_URL,
    }).$extends(withAccelerate())
    return c.text('GET /')
})


api.post('/user/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: (c.env as Env).DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();

    const find_user = await prisma.user.findUnique(
        {
            where: {
                email: body.email
            }
        }
    )

    if (find_user) return c.json({
        message: "user already exist"
    })

    const new_user = await prisma.user.create(
        {
            data: {
                email: body.email,
                password: body.password
            }
        }
    )

    const token = await sign({ userId: new_user.id }, 'vermaji')
    return c.json({ token, message: "user created" })

})


api.post('/user/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: (c.env as Env).DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json()
    const the_user = await prisma.user.findUnique({
        where: {
            email: body.email,
            password: body.password
        }
    })

    if (!the_user) return c.json({ message: "no such user" })

    const token = await sign({ userId: the_user.id }, "vermaji")

    return c.json(
        { token, message: "user logged in" }
    )

})

api.use("/blog/*", async (c, next) => {

    const token_got: string = c.req.header('authorisation')?.split(" ")[1] || '';

    const verification = await verify(token_got, "vermaji")

    if (!verification) return c.json({ message: "unauthorised" })

    // c.req.store_token = (verification as { userId: string }).userId;
    c.req.userId = (verification as { userId: string }).userId;
    await next()

})


api.post('/blog', (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: (c.env as Env).DATABASE_URL,
    }).$extends(withAccelerate())
    return c.text('POST /')
})
api.put('/blog', (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: (c.env as Env).DATABASE_URL,
    }).$extends(withAccelerate())
    return c.text('PUT /')
})

export default api