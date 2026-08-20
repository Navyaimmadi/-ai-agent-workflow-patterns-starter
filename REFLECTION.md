# Reflection

Complete this only after you run and understand all five patterns. Write from your real experience. Do not invent problems or lessons.

## 1. What was most challenging?


The most challenging part was configuring SharedLLM correctly and handling structured output from the model. At first, the API call failed because the project was still using an unused OpenAI key value. After fixing the environment setup, some patterns still failed because the model returned JSON that could not be parsed into the expected schema. This helped me understand that even when the model gives a reasonable answer, the program can fail if the response does not match the exact format required by the code.


## 2. What did you learn about workflow code versus the LLM?

I learned that the LLM generates content, but the TypeScript workflow controls what happens with that content. The code decides which prompt runs next, which route is selected, which tasks run in parallel, and when an evaluator loop should stop. The LLM is only one part of the system; the workflow makes its output predictable and useful.


## 3. Which pattern was easiest to understand, and why?

Prompt chaining was the easiest pattern for me to understand. Each step takes the result from the previous step and uses it in the next prompt. It felt like breaking one large task into a simple sequence of smaller tasks, so the flow was easy to follow in the code and output.


## 4. Which pattern would be most useful in a real project, and why?

Routing would be very useful in a real project because it can send different requests to the right prompt or handler. For example, one application could recognize whether a user needs technical help, billing help, or general information and then use a specialized response for that request.


## 5. What would you improve with more time?

With more time, I would test each pattern with more types of input and improve the prompts so the model returns structured data more consistently. I would also add automated tests for invalid responses and make the error messages even clearer for debugging. This would make the workflows more reliable when they receive unexpected input.
