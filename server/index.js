const {
    client,
    createTables,
    createCustomer,
    createRestaurant,
    fetchCustomers,
    fetchRestaurants,
    createReservation,
    fetchReservations,
    destroyReservation,
} = require('./db')
const express = require('express')
const app = express()
const morgan = require('morgan')
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/customers', async (req, res, next) => {
    try {
        res.send(await fetchCustomers())
    } catch (e) {
        next(e);
    }
})
app.get('/api/restaurants', async (req, res, next) => {
    try {
        res.send(await fetchRestaurants())
    } catch (e) {
        next(e);
    }
})
app.get('/api/reservations', async (req, res, next) => {
    try {
        res.send(await fetchReservations())
    } catch (e) {
        next(e);
    }
})
app.post('/api/customers/:customer_id/reservations/', async (req, res, next) => {
    try {
        res.status(201).send(await createReservation({
            customer_id:
            req.params.customer_id,
            restaurant_id: req.body.restaurant_id,
            date: req.body.date,
            party_count: req.body.party_count
        }));
    } catch (e) {
        next(e);
    }
})
app.delete('/api/customers/:customer_id/reservations/:id', async (req, res, next) => {
    try {
        await destroyReservation({
            id: req.params.id,
            customer_id: req.body.customer_id
        });
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
})
app.use((err, req, res, next) => {
    res.status(err.status || 500).send({error: err.message || err});
})
const init = async () => {
    console.log(`connecting to the database`);
    await client.connect();
    console.log(`connected to the database`);
    await createTables();
    console.log(`tables created`);
    const [garry, peter, bobby, roger, mcdonalds, starbucks, outback_steakhouse, ruby_tuesdays] = await Promise.all([
        createCustomer('Garry'),
        createCustomer('Peter'),
        createCustomer('Bobby'),
        createCustomer('Roger'),
        createRestaurant('Mcdonalds'),
        createRestaurant('Starbucks'),
        createRestaurant('Outback Steakhouse'),
        createRestaurant('Ruby Tuesdays'),
    ]);
    console.log(`Customers: `)
    console.log(await fetchCustomers());
    console.log(`Restaurants: `)
    console.log(await fetchRestaurants());
    const [reservation, reservation1, reservation2] = await Promise.all([
        createReservation({
            customer_id: garry.id,
            restaurant_id: mcdonalds.id,
            date: '04/07/2024',
            party_count: 5
        }),
        createReservation({
            customer_id: bobby.id,
            restaurant_id: starbucks.id,
            date: '03/21/2024',
            party_count: 7
        }),
        createReservation({
            customer_id: roger.id,
            restaurant_id: outback_steakhouse.id,
            date: '01/21/2024',
            party_count: 9
        })
    ]);
    console.log(`Reservations:`)
    console.log(await fetchReservations());
    await destroyReservation({
        id: reservation.id,
        customer_id: reservation.customer_id
    });
    console.log(`Reservations:`)
    console.log(await fetchReservations());
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
        console.log(`TESTING: CURL Commands:`);
        console.log(`curl localhost:${port}/api/customers`);
        console.log(`curl localhost:${port}/api/restaurants`);
        console.log(`curl localhost:${port}/api/reservations`);
        console.log(`curl -X POST localhost:${port}/api/customers/${roger.id}/reservations/ -d ‘{“restaurant_id”:”${starbucks.id}", "date": "05/15/2025”, “party_count”: 7}’ -H "Content-Type:application/json"`);
        console.log(`curl -X DELETE localhost:${port}/api/customers/${roger.id}/reservations/${reservation2.id}`);
    })
}
init()