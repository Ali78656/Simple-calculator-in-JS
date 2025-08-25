"use strict";
// Variables
let num1=document.querySelector(".num1");
let num2=document.querySelector(".num2");
let btn=document.querySelector("button");
let result=document.querySelector("p");

// console.log('num1,num2,btn,result');


const calculateresult= () => {
  if(num1.value === "" || num2.value === ""){
        result.classList.remove("hide");
    result.innerHTML="Input Both Numbers";
    }else{
    let n1=Number(num1.value);
    let n2=Number(num2.value);

    let sum=n1+n2;
    // let sub=n1-n2;
    // let mul=n1*n2;
    // let div=n1/n2;
    // Show result
    result.classList.remove("hide");
    result.innerHTML="Sum = " + sum;
    // result.innerHTML="Sub = "+sub;
    // result.innerHTML="Multiply = "+mul;
    // result.innerHTML="Division = "+div;
    }
    
    
};




// Event listners
btn.addEventListener("click", calculateresult);