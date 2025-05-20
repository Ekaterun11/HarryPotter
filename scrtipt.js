const App = {
            data() {
                return {
                    characters: [],
                    selectedCharacter: null,
                    showLoginModal: false,
                    showRegisterModal: false,
                    currentUser: null,
                    favorites: [],
                    searchQuery: '',
                    sortBy: '',
                    genderFilter: '',
                    aliveFilter: '',
                    loginData: {
                        username: '',
                        password: ''
                    },
                    loginError: '',
                    registerData: {
                        username: '',
                        password: '',
                        lastName: '',
                        firstName: '',
                        middleName: '',
                        phone: '',
                        gender: 'мужской',
                        age: 10,
                        favoriteHouses: []
                    },
                    registerErrors: {
                        lastName: '',
                        firstName: '',
                        middleName: '',
                        phone: '',
                        age: ''
                    },
                    registerError: ''
                };
            },
            computed: {
                filteredCharacters() {
                    let result = [...this.characters];
                    if (this.searchQuery) {
                        const query = this.searchQuery.toLowerCase();
                        result = result.filter(character => 
                            character.name.toLowerCase().includes(query) || 
                            (character.house && character.house.toLowerCase().includes(query)) ||
                            character.actor.toLowerCase().includes(query)
                        );
                    }

                    if (this.genderFilter) {
                        result = result.filter(character => 
                            character.gender.toLowerCase() === this.genderFilter.toLowerCase()
                        );
                    }

                    if (this.aliveFilter) {
                        const isAlive = this.aliveFilter === 'alive';
                        result = result.filter(character => {
                            if (character.alive === undefined) return false;
                            return character.alive === isAlive;
                        });
                    }

                    if (this.sortBy) {
                        const [field, direction] = this.sortBy.split('-');
                        
                        result.sort((a, b) => {
                            let valA, valB;
                            
                            if (field === 'name') {
                                valA = a.name || '';
                                valB = b.name || '';
                            } else if (field === 'house') {
                                valA = a.house || '';
                                valB = b.house || '';
                            } else if (field === 'year') {
                                valA = a.yearOfBirth || 0;
                                valB = b.yearOfBirth || 0;
                            }
                            
                            if (direction === 'asc') {
                                return valA > valB ? 1 : -1;
                            } else {
                                return valA < valB ? 1 : -1;
                            }
                        });
                    }
                    
                    return result;
                },
                favoritesCount() {
                    return this.favorites.length;
                },
                wizardFavoritesCount() {
                    return this.favorites.filter(id => {
                        const character = this.characters.find(c => c.id === id);
                        return character && character.wizard;
                    }).length;
                },
                nonWizardFavoritesCount() {
                    return this.favoritesCount - this.wizardFavoritesCount;
                }
            },
            methods: {
                async fetchCharacters() {
                    try {
                        const response = await fetch('https://hp-api.onrender.com/api/characters');
                        const data = await response.json();
                        this.characters = data.map((char, index) => ({ ...char, id: index }));
                    } catch (error) {
                        console.error('Error fetching characters:', error);
                    }
                },
                openCharacterModal(character) {
                    this.selectedCharacter = character;
                },
                closeCharacterModal() {
                    this.selectedCharacter = null;
                },
                formatKey(key) {
                    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                },
                formatValue(value) {
                    if (Array.isArray(value)) {
                        return value.join(', ');
                    }
                    if (typeof value === 'object' && value !== null) {
                        return JSON.stringify(value);
                    }
                    return value;
                },
                getHouseClass(house) {
                    if (!house) return '';
                    
                    const houseLower = house.toLowerCase();
                    if (houseLower.includes('gryffindor')) return 'gryffindor';
                    if (houseLower.includes('slytherin')) return 'slytherin';
                    if (houseLower.includes('ravenclaw')) return 'ravenclaw';
                    if (houseLower.includes('hufflepuff')) return 'hufflepuff';
                    return '';
                },
                isFavorite(characterId) {
                    return this.favorites.includes(characterId);
                },
                toggleFavorite(character) {
                    const index = this.favorites.indexOf(character.id);
                    
                    if (index === -1) {
                        this.favorites.push(character.id);
                    } else {
                        this.favorites.splice(index, 1);
                    }
                    
                    localStorage.setItem(`favorites_${this.currentUser.username}`, JSON.stringify(this.favorites));
                },
                login() {
                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    const user = users.find(u => 
                        u.username === this.loginData.username && 
                        u.password === this.loginData.password
                    );
                    
                    if (user) {
                        this.currentUser = user;
                        localStorage.setItem('currentUser', JSON.stringify(user));

                        this.favorites = JSON.parse(localStorage.getItem(`favorites_${user.username}`)) || [];
                        
                        this.showLoginModal = false;
                        this.loginError = '';
                        this.loginData = { username: '', password: '' };
                    } else {
                        this.loginError = 'Имя пользователя или пароль не верны';
                    }
                },
                register() {
                    this.registerErrors = {
                        lastName: '',
                        firstName: '',
                        middleName: '',
                        phone: '',
                        age: ''
                    };
                    this.registerError = '';
                    
                    let isValid = true;

                    if (!/^[А-ЯЁ][а-яё]{2,}$/.test(this.registerData.lastName)) {
                        this.registerErrors.lastName = 'Фамилия должна начинаться с заглавной буквы, содержать только русские буквы и быть длиннее 2 символов';
                        isValid = false;
                    }

                    if (!/^[А-ЯЁ][а-яё]{1,}$/.test(this.registerData.firstName)) {
                        this.registerErrors.firstName = 'Имя должно начинаться с заглавной буквы, содержать только русские буквы и быть длиннее 1 символа';
                        isValid = false;
                    }

                    if (this.registerData.middleName && !/^[А-ЯЁ][а-яё]{2,}$/.test(this.registerData.middleName)) {
                        this.registerErrors.middleName = 'Отчество должно начинаться с заглавной буквы, содержать только русские буквы и быть длиннее 2 символов';
                        isValid = false;
                    }
                    
                    if (!/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(this.registerData.phone)) {
                        this.registerErrors.phone = 'Телефон должен быть в формате 8(XXX)XXX-XX-XX';
                        isValid = false;
                    }

                    if (this.registerData.age < 10) {
                        this.registerErrors.age = 'Возраст должен быть не менее 10 лет';
                        isValid = false;
                    }
                    
                    if (!isValid) return;

                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    if (users.some(u => u.username === this.registerData.username)) {
                        this.registerError = 'Username already exists';
                        return;
                    }

                    const newUser = {
                        username: this.registerData.username,
                        password: this.registerData.password,
                        fullName: `${this.registerData.lastName} ${this.registerData.firstName} ${this.registerData.middleName || ''}`.trim(),
                        phone: this.registerData.phone,
                        gender: this.registerData.gender,
                        age: this.registerData.age,
                        favoriteHouses: this.registerData.favoriteHouses
                    };

                    users.push(newUser);
                    localStorage.setItem('users', JSON.stringify(users));

                    this.currentUser = newUser;
                    localStorage.setItem('currentUser', JSON.stringify(newUser));
                    this.favorites = [];

                    this.registerData = {
                        username: '',
                        password: '',
                        lastName: '',
                        firstName: '',
                        middleName: '',
                        phone: '',
                        gender: 'мужской',
                        age: 10,
                        favoriteHouses: []
                    };
                    
                    this.showRegisterModal = false;
                },
                logout() {
                    this.currentUser = null;
                    localStorage.removeItem('currentUser');
                    this.favorites = [];
                },
                resetFilters() {
                    this.searchQuery = '';
                    this.sortBy = '';
                    this.genderFilter = '';
                    this.aliveFilter = '';
                },
                loadUserData() {
                    const user = JSON.parse(localStorage.getItem('currentUser'));
                    if (user) {
                        this.currentUser = user;
                        this.favorites = JSON.parse(localStorage.getItem(`favorites_${user.username}`)) || [];
                    }
                }
            },
            mounted() {
                this.fetchCharacters();
                this.loadUserData();
            }
        };
        

const app = Vue.createApp(App);
app.mount('#app');