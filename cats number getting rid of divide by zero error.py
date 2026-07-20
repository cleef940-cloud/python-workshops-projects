print('How many cats do you have?')

try:
    numCats = int(input())   # Convert input to number
    
    if numCats < 0:
        print('That is backwards! You can\'t have negative cats.')
    elif numCats >= 4:
        print('That is a lot of cats.')
    else:
        print('That is not that many cats.')

except ValueError:
    print("You did not enter a number.")
