def div42by(divideBy):
#gettting an errror happens but what if you can make a program detect errors, work to fix or work around them then continue operation??
    try:
       return 42 /divideBy
    except ZeroDivisionError: #excuses division by zero by working around it a.k.a bypassing it
        print('error you tried to divide by zero')

print(div42by(2))
print(div42by(12))
print(div42by(0))
print (div42by(1))
