import axios from 'axios';
import fs from 'fs';
import jsonfile from 'jsonfile';

const option = {
    headers: {
        'authority': 'gateway.chotot.com',
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,fr-FR;q=0.6,fr;q=0.5',
        'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6InB1YmxpYzpoeWRyYS5qd3QuYWNjZXNzLXRva2VuIiwidHlwIjoiSldUIn0.eyJhdWQiOltdLCJjbGllbnRfaWQiOiJjdF93ZWJfY2xpZW50IiwiZXhwIjoxNjk3NjQ1MTgyLCJleHQiOnt9LCJpYXQiOjE2OTc1NTg3ODEsImlzcyI6Imh0dHA6Ly9jdC1jb3JlLWlkLnVzZXIuc3ZjLmdrZTEuY3QucHJvZC8iLCJqdGkiOiI1MTQ3MjYxMC1hYmQ1LTQ3ZjYtYTk3MC0zYThjOWFlZTBjODQiLCJuYmYiOjE2OTc1NTg3ODEsInNjcCI6WyJvZmZsaW5lIiwib3BlbmlkIiwib2ZmbGluZV9hY2Nlc3MiXSwic3ViIjoiMjU4NzI4MDgifQ.YQJ6LXtK9feVXudapfk_pgBwrej9lj3xlhSbD5xIgaSPn7MZHYCO36FdWQ2u6S09mJLTZt0cCtMKEqMlvsXxzJ7I5HrrUUr4hnQrR5WpEj6jq8faxOL3h-mT5M0g34KhmIvmJO8SywLn_r_Wh8vs6xk7hZZ_JH8n0RK4qsMLKiy4-3C20cZc18V6a7V0lPG7_2QNdapOqK9vHmZ7kq4S0e1nqOpjFhI-DX4ixsY5SoQ49re5aH8p14QBMf-nWmmbTt6iTFxG2JXzM_EfHuEZC1vPkJbWW7a_J0EY1BxboJLz9CSggx4pC5SPSRzK-RypDmaqo8kLGdxcEuONwGo15YD4iYNuS4Jgqyg2VidgfLE0_fHPw8krNM0BZj1iCr0-n0JSra_XKZnZqSR3UlgoFNRyPkKd0qxwrt0W_rZOzajfxwdWSN-KYVOnu3X1NGulea5g4glnm4IlN8rFQEoQPVJjyAFNGWuk_6LTbmdXsC1sTy9G9FrYieN4RA_UtSzlq1LIyqpWQwaPRDbsw8cBnqmZB9gVOiTpl7UpcMDWWhznUxKvR8OgZODU76aAXUztdQ9WOxC02tYV7r2kbFqL6u2CkcY1WgbSop57T67EoH5PMrMT1951SbajPJcwAb23semE05az8jfBOvDOndTP2lLo-nsJzBwBjM1Xuduh6sM',
        'ct-fingerprint': '0654961a-0bd9-4fe6-865b-c308d4c5198f',
        'ct-platform': 'web',
        'origin': 'https://www.nhatot.com',
        'referer': 'https://www.nhatot.com/',
        'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
    }
}

async function getRentalData(numPages) {
    const responseFirstPage = await axios.get('https://gateway.chotot.com/v1/public/ad-listing?limit=20&protection_entitlement=true&cg=1050&st=u,h&key_param_included=true', option);

    let responseAll = [...responseFirstPage.data.ads]
    for (let i = 2; i <= numPages; i++) {
        const responseEachPage = await axios.get(`https://gateway.chotot.com/v1/public/ad-listing?limit=20&o=${20*i-20}&page=${i}&protection_entitlement=true&cg=1050&st=u,h&key_param_included=true`, option);
        // console.log(`i: ${i}, data: ${responseEachPage.data.ads[0].ad_id}`)
        responseAll = [...responseAll, ...responseEachPage?.data?.ads]
    }

    // write to file
    const pathFile = 'data.json'
    const result = {
        length: responseAll.length,
        post: responseAll
    }
    jsonfile.writeFileSync(pathFile, result, { spaces: 4, EOL: '\r\n' })

}

const numPages = process.argv.length > 1 ? process.argv[2] * 1 : 1;

getRentalData(numPages)

// https://gateway.chotot.com/v1/public/ad-listing?cg=1050&o=40&page=3&st=u,h&limit=20&key_param_included=true
// https://gateway.chotot.com/v1/public/ad-listing?cg=1050&o=20&page=2&st=u,h&limit=20&key_param_included=true
// https://gateway.chotot.com/v1/public/ad-listing?cg=1050&o=60&page=4&st=u,h&limit=20&key_param_included=true