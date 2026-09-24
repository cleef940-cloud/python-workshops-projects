def number_pattern (n):
    if type(n) != int:
        return 'Argument must be an integer value.'
    if n<1:
        return 'Argument must be an integer greater than 0.'
    
    result = ''
    for i in range (1, n+1):
        result += str(i)+ ' '
    result = result.strip()
    return result

print(number_pattern(4))    