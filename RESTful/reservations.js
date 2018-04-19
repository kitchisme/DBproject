/**
 * @param {MainRouter} context - context for response function
 */

function setUp(context){

    // get today's reservations, request must provide a patient id either a doctor id
    context.router.get('/reservations', async(ctx, next) => {
        try{
            ctx.status = 200;
            const query = ctx.request.query;
            if(query.pid !== undefined){
                const result = await context.pgPool.query(
                    `SELECT doctors.id, doctors.name
                     FROM today_reservations INNER JOIN doctors
                     ON doctors.id = today_reservations.did
                     WHERE today_reservations.pid = $1;`,
                    [ctx.params.pid]
                );
                ctx.body = JSON.stringify(result.rows);
            } else if(query.did !== undefined) {
                const result = await context.pgPool.query(
                    `SELECT patients.id, patients.name
                     FROM today_reservations INNER JOIN patients USING(patients.id)
                     WHERE did = $1;`,
                    [ctx.params.did]
                );
                ctx.body = JSON.stringify(result.rows);
            } else {
                ctx.body = 'must specify your code';
                ctx.status = 401;
            }
        } catch(e) {
            console.log(e);
            ctx.status = 500;
        }
    })

    // apply for a new reservation in today, request must provide a patient id, a doctor id and a section
    context.router.post('/reservations', async(ctx, next) => {
        const client = await context.pgPool.connect();
        try{
            ctx.status = 200;
            const content = ctx.request.body;
            const result = await client.query(
                `INSERT INTO reservations (commitdate, did, pid, section)
                 VALUES (current_date, $1, $2, $3);`,
                [content.pid, content.did, content.section]
            );
            console.log(result);
            if(result.rowCount !== 1){
                ctx.status = 500;
                ctx.body = 'reservation failed';
            }
        } catch(e) {
            console.log(e);
            ctx.status = 500;
        } finally {
            client.release();
        }
    })

    // cancel a reservation in today, request must provide a patient id, a doctor id and a section
    context.router.delete('/reservations', async(ctx, next) => {
        try{
            ctx.status = 200;
            const content = ctx.request.body;
            const result = await context.pgPool.query(
                `DELETE FROM reservations
                 WHERE
                 reservations.commitdate = current_date
                 and reservations.pid = $1
                 and reservations.did = $2
                 and reservations.section = $3;`,
                [content.pid, content.did, content.section]
            );
            console.log(result);
        } catch (e) {
            console.log(e);
            ctx.status = 500;
        }
    });

}


exports.setUp = setUp