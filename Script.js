// Variables
let n1=document.querySelector(".num1");
let n2=document.querySelector(".num2");
let btn=document.querySelector("button");
let result=document.querySelector("p");

const calculate = () => {

    if ( n1.value === ""|| n2.value === "")
        {
            result.classList.remove("hide");
            result.innerHTML = "Input both numbers";
            result.style.color="red";
        }
    else{
    let n1=Number(n1.value);
    let n2=Number(n2.value);


    let sum = num1 + num2;
    // show result
    result.classList.remove("hide");
    result.innerHTML  = "Sum: " + sum;
    result.style.color="green";
    }

};





//Event-Listner
btn.addEventListener("click",calculate);