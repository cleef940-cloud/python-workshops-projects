programming_languages = ['Python', 'Java' , 'C++', 'Rust']
programming_languages[0] = 'JavaScript'
print(programming_languages)

proramming_languages = ['Python', 'Java' , 'C++', 'Rust']

developer = ['Alice' , 34 , 'Rust Developer']
name, *rest = developer

print(name)
print(rest)

desserts = ['Cake', 'Cookies' , 'Ice Cream' , 'Pie' , 'Brownies']
desserts[1:4]

numbers = [1, 2, 3, 4, 5, 6]
numbers[1::2]

numbers = [ 1, 2, 3 , 4, 5]
numbers.append(6)
print(numbers)
numbers.extend([7, 8, 9])
print(numbers)

numbers .insert(2, 2.5)
print(numbers)
numbers.pop()
print(numbers)
numbers.clear()



numbers = [19 ,2 , 5, 1, 21,43, 11, 7, 3]
numbers.sort()
print(numbers)
numbers.reverse()
print(numbers)