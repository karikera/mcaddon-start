
import inquirer = require('inquirer');

export class Questions
{
    private readonly prompt = inquirer.createPromptModule();

    constructor()
    {
    }

    async select(question:string, preselect:number|null, ...values:string[]):Promise<number>
    {
        if (preselect !== null)
        {
            console.log(`? ${question} ${values[preselect]}`);
            return preselect;
        }
        const res = await this.prompt<{out:string}>({
            name:'out',
            message:question,
            type:'list',
            choices:values,
        });
        return values.indexOf(res.out);
    }
    
}