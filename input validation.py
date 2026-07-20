#input  validation is the topic here , Imagine netering a program where you write the number of cats you own
print('How many cats do you have?')
numCats = input() #when you  answer how manuy cats you have it is assigned to numCats as a variable
try:
    if int(numCats) >= 4: #if the answer returns a string value we convert that to integer heence numcats is converted with a range in between
          print('That is a lot of cats.')
    else:
        print('That is not that many cats')
except ValueError: #it basically warns you or responds you did not write  a number
    print('You did not write a number.')    









#problem with this code would be user can type anything ,they dont have type a number
    # we can add another try and accept value so that  it can try and accept a 'response' typer in a form idle will return an error response so for example int("six") which can not be recognised in the algorithmic writing of python shell..
    
