import { GetStaticProps } from 'next'
import Head from 'next/head'
import { SubscribeButton } from '../components/SubscribeButton/inde'
import { stripe } from '../services/stripe'
import styles from './home.module.scss'

//Clinte-side => quando as informações seram envidas depois do carregamento. ex: Comentarios de um blog.

//Server-side => informações em tempo real do usuario ex: Olá thiago. Header

// Static Side Generation => paginas com informações compartilhadas iguais para todos os usuarios.

interface HomeProps {
  product: {
    priceId: string;
    amount: number;
  }
}

export default function Home({ product }: HomeProps) {

  return (
    <>
      <Head>
        <title>Home | Ig.news</title>
      </Head>
      <main className={styles.contentContainer}>
        <section
          className={styles.hero}>
          <span>👏 Hey, welcome</span>
          <h1>News about the <span>React</span> world.</h1>
          <p>Get access to all the publications <br />
            <span>for {product.amount} month</span> </p>
          <SubscribeButton priceId={product.priceId} />
        </section>
        <img src="/images/avatar.svg" alt="Girl-Coding" />

      </main>
    </>

  )
}
export const getStaticProps: GetStaticProps = async () => {
  const price = await stripe.prices.retrieve('price_1KXtE3GyyqeuYEWfsZ60HIkS')
  const product = {
    priceId: price.id,
    amount: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price.unit_amount / 100), //Formatação valor
  }
  return {
    props: {
      product,
    },
    revalidate: 60 * 60 * 24, //24 horas
  }
}

