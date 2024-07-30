import { Hono } from 'hono'
import { handle } from 'hono/vercel'

import { searchRoute } from '@/app/routes/search'
import { tableRoute } from '@/app/routes/table'
import { userRoute } from '@/app/routes/user'
import { pageRoute } from '@/app/routes/page'

const app = new Hono().basePath('/v1')

app.get("/page/:pageId", pageRoute);
app.get("/table/:pageId", tableRoute);
app.get("/user/:userId", userRoute);
app.get("/search", searchRoute);


export const GET = handle(app)
export const POST = handle(app)
