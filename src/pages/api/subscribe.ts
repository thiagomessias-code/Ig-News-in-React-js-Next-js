import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../services/stripe";
import { getSession } from "next-auth/react";
import { fauna } from "../../services/fauna";
import { query as q } from "faunadb";


type User = {
    ref: {
        id: string;
    },
    data: {
        stripe_customer_id: string
    }
}



export default async (req: NextApiRequest, res: NextApiResponse) => {

    if (req.method === 'POST') {
        const session = await getSession({ req })

        const user = await fauna.query<User>(
            q.Get(
                q.Match(
                    q.Index("user_by_email"), // Procura usuário por email
                    q.Casefold(session.user.email) // O email é igual
                )
            )
        );

        let customerId = user.data.stripe_customer_id
        
        if (!customerId) {
            const stripeCustomer = await stripe.customers.create({
                email: session.user.email,
            })
            await fauna.query(
                q.Update(
                    q.Ref(q.Collection('users'), user.ref.id),
                    {
                        data: {
                            stripe_costumer_id: stripeCustomer.id
                        }
                    }
                )
            )
            customerId = stripeCustomer.id
        }





        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            customer: customerId, // Quem esta comprando;
            payment_method_types: ["card"], // Tipos de pagamento;
            billing_address_collection: "required", // Obriga ou não preencher o endereço (auto);
            line_items: [{ price: 'price_1KXtE3GyyqeuYEWfsZ60HIkS', quantity: 1 }], // Itens;
            mode: "subscription", // Pagamento recorrente;
            allow_promotion_codes: true, // Permite cupons;
            success_url: process.env.STRIPE_SUCCESS_URL, // Sucesso;
            cancel_url: process.env.STRIPE_CANCEL_URL, // Erro;
        });
        return res.status(200).json({ sessionId: stripeCheckoutSession.id })
    } else {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method not allowed')
    }
}