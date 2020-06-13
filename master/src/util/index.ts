function startCronJob(job: Function, interval: number){

    function cronJob(){
        job()
        setTimeout(cronJob, interval)
    }

    setTimeout(cronJob, interval)
}

export {startCronJob}